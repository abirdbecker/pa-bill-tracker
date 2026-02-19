/**
 * PA Legislative Tracker — fetch + parse utilities
 * Enhanced port of legis_client.js with member ID extraction and contact scraping.
 */

const BASE = 'https://www.palegis.us';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchPage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return await res.text();
}

function billUrl(billId, sessionYear = '2025') {
  const match = billId.match(/^(S|H)(B|R)(\d+)$/i);
  if (!match) throw new Error(`Invalid bill ID: ${billId}`);
  const [, chamber, type, num] = match;
  const slug = `${chamber.toLowerCase()}${type.toLowerCase()}${num}`;
  return `${BASE}/legislation/bills/${sessionYear}/${slug}`;
}

function searchUrl(keyword, sessionYear = '2025') {
  const params = new URLSearchParams({
    sessYr: sessionYear,
    sessInd: '0',
    keyword,
    searchType: 'text',
    billBody: '',
    billType: 'B',
    currPNOnly: 'true'
  });
  return `${BASE}/legislation/bills/bill-keyword-search?${params}`;
}

/**
 * Parse bill detail page HTML → structured data
 * Enhanced: captures member IDs from bio URLs for photo URLs
 */
function parseBillPage(html) {
  const result = {
    title: '',
    shortTitle: '',
    primeSponsor: null,
    coSponsors: [],
    lastAction: '',
    chamber: '',
    committee: '',
    timeline: []
  };

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    result.title = titleMatch[1]
      .replace(/\s*Information;.*$/, '')
      .replace(/ - The Official.*$/, '')
      .trim();
  }

  const shortMatch = html.match(/id="shortTitle-wrapper">\s*([\s\S]*?)\s*<\/div>/);
  if (shortMatch) {
    // Expand hidden text, strip all HTML tags and buttons
    let short = shortMatch[1]
      .replace(/class="d-none"/g, '')  // unhide truncated text
      .replace(/<[^>]+>/g, '')         // strip HTML tags
      .replace(/\. \. \./g, '')        // remove ellipsis markers
      .replace(/\s+/g, ' ')
      .trim();
    result.shortTitle = short;
  }

  const lastActionMatch = html.match(/<strong>Last Action:\s*<\/strong>([\s\S]*?)(?=\n\s*<span)/);
  if (lastActionMatch) {
    result.lastAction = lastActionMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&#160;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const chamberMatch = html.match(/Legislation is currently in the <strong>(\w+)<\/strong>/);
  if (chamberMatch) {
    result.chamber = chamberMatch[1];
  }

  // Prime sponsor — enhanced to capture member ID
  const primeSection = html.match(/Prime Sponsor<hr><\/div>([\s\S]*?)(?=<div class="h3|<div class="accordion)/);
  if (primeSection) {
    const sponsors = extractSponsorsEnhanced(primeSection[1]);
    if (sponsors.length > 0) result.primeSponsor = sponsors[0];
  }

  // Co-sponsors
  const coSection = html.match(/Co-Sponsors<hr><\/div>([\s\S]*?)(?=<div[^>]*id="section-pn"|$)/);
  if (coSection) {
    result.coSponsors = extractSponsorsEnhanced(coSection[1]);
  }

  // Timeline — look for timeline-Element divs with bg-color-success vs bg-color-neutral
  const timelineStart = html.indexOf('timeline timeline-big');
  const timelineEnd = html.indexOf('section-pn', timelineStart);
  if (timelineStart > -1 && timelineEnd > -1) {
    const timelineHtml = html.slice(timelineStart, timelineEnd);

    // Match each timeline-Element (not spacers)
    const elemRe = /<div class="timeline-Element\s+(bg-color-\w+)">([\s\S]*?)(?=<div class="timeline-Element|$)/g;
    let elem;
    while ((elem = elemRe.exec(timelineHtml)) !== null) {
      const colorClass = elem[1];
      const elemHtml = elem[2];
      const isComplete = colorClass === 'bg-color-success';

      // Skip spacer elements
      if (elem[0].includes('timeline-Element-Spacer')) continue;

      const tooltipMatch = elemHtml.match(/data-(?:bs-)?toggle="tooltip"[^>]*title="([\s\S]*?)"/);
      if (tooltipMatch) {
        const tooltip = tooltipMatch[1]
          .replace(/<strong>/g, '').replace(/<\/strong>/g, '')
          .replace(/<div[^>]*>/g, ' — ').replace(/<\/div>/g, '')
          .replace(/<\/?p>/g, '\n').replace(/<br\s*\/?>/g, '\n')
          .replace(/&nbsp;|&#160;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (tooltip && !tooltip.startsWith('Navigate to')) {
          result.timeline.push({ label: tooltip, completed: isComplete });
        }
      }
    }

    // Fallback: simple tooltip extraction with text-based completion detection
    if (result.timeline.length === 0) {
      const timelineRe = /data-(?:bs-)?toggle="tooltip"[^>]*title="([\s\S]*?)"/g;
      let tm;
      while ((tm = timelineRe.exec(timelineHtml)) !== null) {
        const tooltip = tm[1]
          .replace(/<strong>/g, '').replace(/<\/strong>/g, '')
          .replace(/<div[^>]*>/g, ' — ').replace(/<\/div>/g, '')
          .replace(/<\/?p>/g, '\n').replace(/<br\s*\/?>/g, '\n')
          .replace(/&nbsp;|&#160;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (tooltip && !tooltip.startsWith('Navigate to')) {
          const isPending = tooltip.includes('has not yet reached this milestone');
          result.timeline.push({ label: tooltip, completed: !isPending });
        }
      }
    }
  }

  const committeeMatch = html.match(/class='committee[^']*'>([^<]+)<\/a>/);
  if (committeeMatch) {
    result.committee = committeeMatch[1];
  }

  return result;
}

/**
 * Enhanced sponsor extraction — captures member ID from bio URL for photo/contact
 */
function extractSponsorsEnhanced(html) {
  const sponsors = [];
  const re = /<a href='(\/(?:senate|house)\/members\/bio\/(\d+)\/[^']*)' [^>]*>([^<]+)<\/a>[\s\S]*?<span class="badge bg-party-(\w)">[\s\S]*?(?:Senate|House) District(?:&nbsp;|\s)+(\d+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const bioPath = m[1];
    const memberId = m[2];
    const chamber = bioPath.startsWith('/senate') ? 'Senate' : 'House';
    sponsors.push({
      name: m[3].trim(),
      party: m[4],
      district: m[5],
      memberId,
      bioPath,
      photoUrl: `${BASE}/resources/images/members/300/${memberId}.jpg`,
      chamber
    });
  }

  return sponsors;
}

/**
 * Parse keyword search results HTML → list of bill stubs
 */
function parseSearchResults(html) {
  const bills = [];
  const countMatch = html.match(/returned <strong>(\d+)<\/strong> results/);
  const count = countMatch ? parseInt(countMatch[1]) : 0;
  if (count === 0) return bills;

  const cardRe = /href="\/legislation\/bills\/\d+\/(\w+)"[^>]*>(\w+)\s*&nbsp;\s*P\.N\.\s*&nbsp;(\d+)/g;
  let card;
  const seen = new Set();

  while ((card = cardRe.exec(html)) !== null) {
    const slug = card[1];
    const billId = card[2].replace(/^([A-Z]{2})0*(\d+)$/, '$1$2');

    if (seen.has(billId)) continue;
    seen.add(billId);

    const afterCard = html.slice(card.index);
    const shortTitleMatch = afterCard.match(/<strong>Short Title:<\/strong>[\s\S]*?<div class="col-lg-10 flex-grow-1">\s*([\s\S]*?)\s*<\/div>/);
    const lastActionMatch = afterCard.match(/<strong>Last Action:<\/strong>[\s\S]*?<div class="col-lg-10 flex-grow-1">\s*([\s\S]*?)\s*<\/div>/);

    bills.push({
      billId,
      slug,
      url: `${BASE}/legislation/bills/2025/${slug}`,
      shortTitle: shortTitleMatch ? shortTitleMatch[1].replace(/&#160;/g, ' ').trim() : '',
      lastAction: lastActionMatch ? lastActionMatch[1].replace(/&#160;/g, ' ').replace(/<[^>]+>/g, '').trim() : ''
    });
  }

  return bills;
}

/**
 * Fetch member bio page → extract contact info (email, phone, offices)
 */
async function fetchMemberContact(bioPath) {
  const url = `${BASE}${bioPath}`;
  try {
    const html = await fetchPage(url);
    const contact = { email: null, phone: null, offices: [] };

    // Email — often obfuscated via JS, try multiple patterns
    const emailPatterns = [
      /mailto:([^"']+)/,
      /['"]([a-zA-Z0-9._%+-]+@(?:pasen|pahouse|pahousegop)\.gov)['"]/,
      /([a-zA-Z0-9._%+-]+@(?:pasen|pahouse|pahousegop)\.gov)/
    ];
    for (const pat of emailPatterns) {
      const m = html.match(pat);
      if (m) { contact.email = m[1].trim(); break; }
    }

    // Phone — look specifically for formatted phone numbers (xxx) xxx-xxxx
    // Only look in the contact/address portion of the page to avoid picking up random numbers
    const contactArea = html.match(/District Address([\s\S]*?)(?=<footer|<script|$)/)?.[1] || '';
    const phoneRe = /\(\d{3}\)\s*\d{3}[-.]?\d{4}/g;
    const phones = new Set();
    let pm;
    while ((pm = phoneRe.exec(contactArea)) !== null) {
      phones.add(pm[0]);
    }
    const phoneList = [...phones];

    // Capitol phone is usually the one with 717 area code
    const capitolPhone = phoneList.find(p => p.startsWith('(717)'));
    const districtPhone = phoneList.find(p => !p.startsWith('(717)'));
    contact.phone = capitolPhone || districtPhone || phoneList[0] || null;
    contact.districtPhone = districtPhone || null;

    return contact;
  } catch (err) {
    console.error(`  Warning: couldn't fetch contact for ${bioPath}: ${err.message}`);
    return { email: null, phone: null, offices: [] };
  }
}

export {
  fetchPage, billUrl, searchUrl, parseBillPage,
  parseSearchResults, fetchMemberContact, BASE
};
