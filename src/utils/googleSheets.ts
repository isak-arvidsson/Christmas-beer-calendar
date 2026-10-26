import { BeerDay, CalendarRatings, TesterId } from '../types.ts';
import { INITIAL_BEERS } from '../data/initialBeers.ts';

/**
 * Normalizes Google Sheets URLs to direct CSV export URLs
 */
export function normalizeGoogleSheetCsvUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Already a pub?output=csv or export?format=csv
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv')) {
    return trimmed;
  }

  // If user pasted standard spreadsheet URL: https://docs.google.com/spreadsheets/d/<ID>/edit...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const id = match[1];
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
  }

  return trimmed;
}

/**
 * Parse standard CSV with commas and quotes
 */
export function parseCsvRows(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Parses CSV rows into BeerDay array and optional ratings
 */
export function parseBeersFromCsv(
  csvText: string
): { beers: BeerDay[]; ratingsPatch?: CalendarRatings } {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    throw new Error('CSV-filen saknar rader eller har ogiltigt format.');
  }

  const header = rows[0].map((h) => h.toLowerCase().trim());
  
  // Find column indices
  const dayIdx = header.findIndex((h) => h.includes('dag') || h.includes('day'));
  const breweryIdx = header.findIndex((h) => h.includes('bryggeri') || h.includes('brewery'));
  const nameIdx = header.findIndex((h) => h.includes('namn') || h.includes('öl') || h.includes('beer') || h.includes('name'));
  const styleIdx = header.findIndex((h) => h.includes('stil') || h.includes('style'));
  const abvIdx = header.findIndex((h) => h.includes('abv') || h.includes('alkohol') || h.includes('styrka') || h.includes('%'));
  const urlIdx = header.findIndex((h) => h.includes('systembolaget') || h.includes('url') || h.includes('länk'));
  const descIdx = header.findIndex((h) => h.includes('beskrivning') || h.includes('desc') || h.includes('noter'));
  const imgIdx = header.findIndex((h) => h.includes('bild') || h.includes('image') || h.includes('img'));

  // Testers columns
  const isakIdx = header.findIndex((h) => h.includes('isak'));
  const ingridIdx = header.findIndex((h) => h.includes('ingrid'));
  const gustavIdx = header.findIndex((h) => h.includes('gustav'));
  const louiseIdx = header.findIndex((h) => h.includes('louise'));

  const parsedBeers: BeerDay[] = [];
  const ratingsPatch: CalendarRatings = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawDay = dayIdx !== -1 ? parseInt(row[dayIdx], 10) : i;
    const day = isNaN(rawDay) ? i : rawDay;

    if (day < 1 || day > 24) continue;

    const fallback = INITIAL_BEERS.find((b) => b.day === day) || INITIAL_BEERS[day - 1] || INITIAL_BEERS[0];

    const brewery = (breweryIdx !== -1 && row[breweryIdx]) || fallback.brewery;
    const name = (nameIdx !== -1 && row[nameIdx]) || fallback.name;
    const style = (styleIdx !== -1 && row[styleIdx]) || fallback.style;
    const rawAbv = abvIdx !== -1 ? parseFloat(row[abvIdx]?.replace(',', '.') || '') : NaN;
    const abv = !isNaN(rawAbv) ? rawAbv : fallback.abv;
    const systembolagetUrl = (urlIdx !== -1 && row[urlIdx]) || fallback.systembolagetUrl;
    const description = (descIdx !== -1 && row[descIdx]) || fallback.description;
    const imageUrl = (imgIdx !== -1 && row[imgIdx]) || fallback.imageUrl;

    parsedBeers.push({
      day,
      brewery,
      name,
      style,
      abv,
      systembolagetUrl,
      description,
      imageUrl,
      origin: fallback.origin,
      servingTemp: fallback.servingTemp,
    });

    // Check if ratings are present in sheet
    const testerIndices: [TesterId, number][] = [
      ['isak', isakIdx],
      ['ingrid', ingridIdx],
      ['gustav', gustavIdx],
      ['louise', louiseIdx],
    ];

    for (const [testerId, colIdx] of testerIndices) {
      if (colIdx !== -1 && row[colIdx]) {
        const val = parseFloat(row[colIdx].replace(',', '.'));
        if (!isNaN(val) && val >= 0 && val <= 10) {
          if (!ratingsPatch[day]) {
            ratingsPatch[day] = {};
          }
          ratingsPatch[day][testerId] = {
            score: Math.round(val * 10) / 10,
            ratedAt: new Date().toISOString(),
          };
        }
      }
    }
  }

  // Sort by day
  parsedBeers.sort((a, b) => a.day - b.day);

  return { beers: parsedBeers, ratingsPatch: Object.keys(ratingsPatch).length > 0 ? ratingsPatch : undefined };
}

/**
 * Generates an exportable CSV containing all 24 beers and ratings
 */
export function exportCalendarToCsv(beers: BeerDay[], ratings: CalendarRatings): string {
  const headers = [
    'Dag',
    'Bryggeri',
    'Ölnamn',
    'Stil',
    'Alkoholhalt (%)',
    'Systembolaget URL',
    'Bild URL',
    'Beskrivning',
    'Isak',
    'Ingrid',
    'Gustav',
    'Louise',
    'Medelbetyg',
  ];

  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = beers.map((beer) => {
    const dayRating = ratings[beer.day] || {};
    const isakScore = dayRating.isak?.score ?? '';
    const ingridScore = dayRating.ingrid?.score ?? '';
    const gustavScore = dayRating.gustav?.score ?? '';
    const louiseScore = dayRating.louise?.score ?? '';

    const validScores = [isakScore, ingridScore, gustavScore, louiseScore].filter(
      (s): s is number => typeof s === 'number'
    );
    const avg = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : '';

    return [
      escapeCell(beer.day),
      escapeCell(beer.brewery),
      escapeCell(beer.name),
      escapeCell(beer.style),
      escapeCell(beer.abv),
      escapeCell(beer.systembolagetUrl),
      escapeCell(beer.imageUrl || ''),
      escapeCell(beer.description),
      escapeCell(isakScore),
      escapeCell(ingridScore),
      escapeCell(gustavScore),
      escapeCell(louiseScore),
      escapeCell(avg),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
