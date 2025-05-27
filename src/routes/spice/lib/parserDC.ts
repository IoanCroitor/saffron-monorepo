/**
 * Parser for DC analysis in SPICE netlists
 */

export type ParserType = {
  dc: boolean;
  sweep: boolean;
  sweepVar: string;
  sweepStart: number;
  sweepEnd: number;
  sweepStep: number;
};

export function getParser(netList: string): ParserType {
  const parseResults: ParserType = {
    dc: false,
    sweep: false,
    sweepVar: "",
    sweepStart: 0,
    sweepEnd: 0,
    sweepStep: 0,
  };

  const dcLine = netList.match(/^(.dc.*)/m);

  if (dcLine) {
    parseResults.dc = true;
    // Split by whitespace
    const s = dcLine[0].toString().split(/[ ]+/);
    if (s.length == 9) {
      parseResults.sweep = true;
      parseResults.sweepVar = s[5];
      parseResults.sweepStart = parseFloat(s[6]);
      parseResults.sweepEnd = parseFloat(s[7]);
      parseResults.sweepStep = parseFloat(s[8]);
    }
  }

  console.log("parser->", parseResults);
  return parseResults;
}

export const parser = getParser;