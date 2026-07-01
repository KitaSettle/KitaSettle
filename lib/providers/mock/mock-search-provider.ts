import type { SearchProvider, SearchRequest, SearchResult } from "../types/search-provider";

const MOCK_RESULTS: SearchResult[] = [
  {
    title: "ICAO RVSM monitoring requirements — Asia-Pacific update",
    url: "https://www.icao.int/safety/airnavigation/rvsm-asia-pacific-update",
    snippet: "Revised height-keeping performance thresholds for Asia-Pacific routes.",
    source: "ICAO",
    score: 0.93,
  },
  {
    title: "FAA CBTA advisory circular — evidence standards",
    url: "https://www.faa.gov/regulations_policies/advisory_circulars/",
    snippet: "Updated competency evidence capture and assessor qualifications.",
    source: "FAA",
    score: 0.91,
  },
  {
    title: "CAAM recurrent training compliance windows",
    url: "https://www.caam.gov.my/",
    snippet: "Tighter recurrent check documentation and simulator logging guidance.",
    source: "CAAM",
    score: 0.86,
  },
];

export class MockSearchProvider implements SearchProvider {
  readonly name = "mock-search";
  readonly implementation = "mock" as const;
  readonly ready = true;

  async search(request: SearchRequest): Promise<SearchResult[]> {
    const query = request.query.toLowerCase();
    const limit = request.limit ?? 5;

    return MOCK_RESULTS.filter(
      (result) =>
        result.title.toLowerCase().includes(query) ||
        result.snippet.toLowerCase().includes(query) ||
        result.source.toLowerCase().includes(query) ||
        query.length < 3,
    ).slice(0, limit);
  }
}

export const mockSearchProvider = new MockSearchProvider();
