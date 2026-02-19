#!/usr/bin/env node
/**
 * Build data pipeline — scans palegis.us keyword searches, fetches bill details,
 * extracts sponsor info with photos/contacts, outputs public/data/bills.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  fetchPage, searchUrl, parseBillPage, parseSearchResults,
  billUrl, fetchMemberContact
} from './legis-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const issues = JSON.parse(readFileSync(join(ROOT, 'data/issues.json'), 'utf-8'));
const knownBills = JSON.parse(readFileSync(join(ROOT, 'data/known-bills.json'), 'utf-8'));

// Member contact cache (7-day TTL)
const CACHE_PATH = join(ROOT, '.member-cache.json');
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
let memberCache = {};

if (existsSync(CACHE_PATH)) {
  try {
    const cached = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    const now = Date.now();
    for (const [key, val] of Object.entries(cached)) {
      if (now - val._ts < CACHE_TTL) memberCache[key] = val;
    }
  } catch { /* ignore corrupt cache */ }
}

function saveCache() {
  writeFileSync(CACHE_PATH, JSON.stringify(memberCache, null, 2));
}

async function getMemberContact(bioPath) {
  const key = bioPath;
  if (memberCache[key]) return memberCache[key];

  const contact = await fetchMemberContact(bioPath);
  contact._ts = Date.now();
  memberCache[key] = contact;
  return contact;
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Build a clear status string from bill detail + lastAction.
 * e.g. "In House Education Committee — Referred Feb. 4, 2026"
 */
function buildStatus(detail, lastAction) {
  const parts = [];

  // Where the bill currently sits
  if (detail.chamber && detail.committee) {
    parts.push(`In ${detail.chamber} ${detail.committee} Committee`);
  } else if (detail.chamber) {
    parts.push(`In the ${detail.chamber}`);
  }

  // What happened — extract the action and date from lastAction
  if (lastAction) {
    // Parse out action type and date
    // e.g. "Referred to Education, Feb. 4, 2026" → "Referred Feb. 4, 2026"
    // e.g. "Laid on the table, Nov. 18, 2025" → "Laid on the table Nov. 18, 2025"
    // e.g. "Third consideration and final passage (46-1), Feb. 3, 2026"
    const dateMatch = lastAction.match(/,\s*(\w+\.?\s+\d{1,2},\s*\d{4})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Get the action verb/phrase, stripping redundant committee name
    let action = lastAction
      .replace(/,\s*\w+\.?\s+\d{1,2},\s*\d{4}/, '') // remove date
      .trim()
      .replace(/,\s*$/, '');                           // trailing comma

    // Remove redundant committee references since we show it in the location
    if (detail.committee) {
      action = action
        .replace(new RegExp(`\\s+to\\s+${detail.committee}.*$`, 'i'), '')
        .replace(new RegExp(`\\s+from\\s+${detail.committee}.*$`, 'i'), '')
        .replace(/\s+to\s+[\w\s&]+\[(?:Senate|House)\]$/i, '')
        .trim();
    }

    if (action && date) {
      parts.push(`${action} ${date}`);
    } else if (lastAction) {
      parts.push(lastAction);
    }
  }

  return parts.join(' — ') || lastAction || '';
}

/**
 * Parse a date from lastAction string like "Referred to Education, Feb. 4, 2026"
 * Returns a Date for sorting (epoch 0 if unparseable)
 */
function parseActionDate(lastAction) {
  if (!lastAction) return new Date(0);
  // Match patterns like "Feb. 4, 2026" or "Aug. 20, 2025" or "November 18, 2025"
  const dateMatch = lastAction.match(/(\w+\.?\s+\d{1,2},\s*\d{4})/);
  if (!dateMatch) return new Date(0);
  const parsed = new Date(dateMatch[1].replace(/\./g, ''));
  return isNaN(parsed) ? new Date(0) : parsed;
}

async function scanIssue(issue) {
  const allBills = new Map();

  for (const keyword of issue.keywords) {
    const url = searchUrl(keyword, issues.session_year);
    try {
      const html = await fetchPage(url);
      const bills = parseSearchResults(html);
      for (const bill of bills) {
        if (!allBills.has(bill.billId)) {
          bill.matchedKeywords = [keyword];
          allBills.set(bill.billId, bill);
        } else {
          allBills.get(bill.billId).matchedKeywords.push(keyword);
        }
      }
    } catch (err) {
      console.error(`  Warning: search for "${keyword}" failed: ${err.message}`);
    }
    await delay(300);
  }

  return Array.from(allBills.values());
}

async function main() {
  console.log('PA Bill Tracker — Building data...\n');

  // Step 1: Scan all issues for bills
  const billsByIssue = {};
  const allDiscovered = new Map(); // billId → { issues: [], stub }

  for (const issue of issues.issues) {
    console.log(`Scanning: ${issue.name}...`);
    const bills = await scanIssue(issue);
    console.log(`  Found ${bills.length} bills`);

    for (const bill of bills) {
      // Skip hidden bills
      if (knownBills.hide.includes(bill.billId)) continue;

      if (!allDiscovered.has(bill.billId)) {
        allDiscovered.set(bill.billId, { issues: [issue.name], stub: bill });
      } else {
        allDiscovered.get(bill.billId).issues.push(issue.name);
      }
    }
  }

  console.log(`\nTotal unique bills: ${allDiscovered.size}`);

  // Step 2: Fetch full details for each bill
  const fullBills = [];

  for (const [billId, { issues: issueNames, stub }] of allDiscovered) {
    console.log(`Fetching: ${billId}...`);
    try {
      const url = billUrl(billId, issues.session_year);
      const html = await fetchPage(url);
      const detail = parseBillPage(html);

      // Fetch prime sponsor contact info
      let primeContact = null;
      if (detail.primeSponsor?.bioPath) {
        primeContact = await getMemberContact(detail.primeSponsor.bioPath);
      }

      const lastAction = detail.lastAction || stub.lastAction;
      const status = buildStatus(detail, lastAction);

      const bill = {
        id: billId,
        url: stub.url,
        title: detail.shortTitle || detail.title || stub.shortTitle,
        nickname: knownBills.nicknames[billId] || null,
        description: knownBills.descriptions?.[billId] || null,
        note: knownBills.notes[billId] || null,
        issues: issueNames,
        lastAction,
        status,
        chamber: detail.chamber,
        committee: detail.committee,
        timeline: detail.timeline,
        primeSponsor: detail.primeSponsor ? {
          ...detail.primeSponsor,
          email: primeContact?.email || null,
          phone: primeContact?.phone || null,
          offices: primeContact?.offices || []
        } : null,
        coSponsorCount: detail.coSponsors.length,
        coSponsors: detail.coSponsors.slice(0, 5), // Top 5 for display
        matchedKeywords: stub.matchedKeywords
      };

      fullBills.push(bill);
    } catch (err) {
      console.error(`  Error fetching ${billId}: ${err.message}`);
      // Still include with stub data
      fullBills.push({
        id: billId,
        url: stub.url,
        title: stub.shortTitle,
        nickname: knownBills.nicknames[billId] || null,
        description: knownBills.descriptions?.[billId] || null,
        note: knownBills.notes[billId] || null,
        issues: issueNames,
        lastAction: stub.lastAction,
        chamber: null,
        committee: null,
        timeline: [],
        primeSponsor: null,
        coSponsorCount: 0,
        coSponsors: [],
        matchedKeywords: stub.matchedKeywords
      });
    }
    await delay(300);
  }

  // Step 3: Group by primary issue
  const grouped = {};
  for (const issue of issues.issues) {
    grouped[issue.name] = [];
  }

  for (const bill of fullBills) {
    const primaryIssue = bill.issues[0];
    if (grouped[primaryIssue]) {
      grouped[primaryIssue].push(bill);
    }
  }

  // Sort bills within each issue by most recent activity
  for (const bills of Object.values(grouped)) {
    bills.sort((a, b) => {
      const dateA = parseActionDate(a.lastAction);
      const dateB = parseActionDate(b.lastAction);
      return dateB - dateA; // most recent first
    });
  }

  // Remove empty issues
  for (const key of Object.keys(grouped)) {
    if (grouped[key].length === 0) delete grouped[key];
  }

  const output = {
    generated: new Date().toISOString(),
    sessionYear: issues.session_year,
    totalBills: fullBills.length,
    issues: grouped
  };

  const outPath = join(ROOT, 'public/data/bills.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${outPath} — ${fullBills.length} bills across ${Object.keys(grouped).length} issues`);

  saveCache();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
