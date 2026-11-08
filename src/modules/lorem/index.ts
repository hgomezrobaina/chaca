import { loremIpsum } from "lorem-ipsum";
import { DatatypeModule } from "../datatype";

export type WordsProps = {
  count?: number;
};

export type ParagraphProps = {
  count?: number;
};

export type SlugProps = {
  wordCount?: number;
};

export type SentencesProps = {
  sentencesCount?: number;
  separator?: string;
  wordsMax?: number;
  wordsMin?: number;
};

export type SentenceProps = { wordsMax?: number; wordsMin?: number };

export type ParagraphsProps = {
  paragraphsCount?: number;
  separator?: string;
  minSentences?: number;
  maxSentences?: number;
};

export class LoremModule {
  constructor(private readonly datatypeModule: DatatypeModule) {}

  /**
   * @param args.paragraphsCount Number of paragraphs. Default `3`
   * @param args.separator Separator between paragraphs. Default `\n`
   * @param args.maxSentences Maximun of sentences of each paragraphs
   * @param args.minSentences Min of sentences of each paragraphs
   *
   * @example modules.lorem.paragraphs()
   * @returns string
   */
  paragraphs({
    maxSentences,
    minSentences,
    paragraphsCount,
    separator: iseparator,
  }: ParagraphsProps = {}): string {
    const separator = iseparator ? iseparator : "\n";
    const cant =
      typeof paragraphsCount === "number" && paragraphsCount > 0
        ? paragraphsCount
        : 3;
    const minS =
      typeof minSentences === "number" && minSentences > 0
        ? minSentences
        : undefined;
    const maxS =
      typeof maxSentences === "number" && maxSentences > 0
        ? maxSentences
        : undefined;

    return loremIpsum({
      format: "plain",
      suffix: separator,
      count: cant,
      paragraphUpperBound: maxS,
      paragraphLowerBound: minS,
      units: "paragraphs",
    });
  }

  /**
   * @param args.sentencesCount Number of sentences. Default in `3`
   * @param args.separator Separator between sentences. Default `\n`
   * @param args.wordsMin Minimun of words in each sentence
   * @param args.wordsMax Maximun of words in each sentence
   *
   * @example modules.lorem.sentences()
   * @returns
   */
  sentences({
    sentencesCount,
    separator: iseparator,
    wordsMax,
    wordsMin,
  }: SentencesProps = {}): string {
    const cant =
      typeof sentencesCount === "number" && sentencesCount > 0
        ? sentencesCount
        : 3;
    const separator = iseparator ? iseparator : "\n";
    const wordMin =
      typeof wordsMin === "number" && wordsMin > 0 ? wordsMin : undefined;
    const wordMax =
      typeof wordsMax === "number" && wordsMax > 0 ? wordsMax : undefined;

    return loremIpsum({
      format: "plain",
      units: "sentences",
      count: cant,
      suffix: separator,
      sentenceLowerBound: wordMin,
      sentenceUpperBound: wordMax,
    });
  }

  /**
   * @param args.wordCount Number of words in the slug. Default `3`
   * @example modules.lorem.slug() // 'lorem-ipsum-ad'
   * @returns string
   */
  slug({ wordCount }: SlugProps = {}): string {
    const cant = typeof wordCount === "number" && wordCount > 0 ? wordCount : 3;

    const words = loremIpsum({
      format: "plain",
      count: cant,
      units: "words",
    });

    let retString = "";
    for (let i = 0; i < words.length; i++) {
      retString = retString.concat(words[i] === " " ? "-" : words[i]);
    }

    // The word list has one capitalized entry ("Lorem", meant to lead a
    // sentence), which would otherwise leak into a slug — a slug is
    // lowercase by definition.
    return retString.toLowerCase();
  }

  /**
   *
   * @param args.count Number or words.
   * @example modules.lorem.words() // 'lorem ipsum in'
   * @returns string
   */
  words({ count: icount }: WordsProps = {}): string {
    const count =
      typeof icount === "number" && icount >= 0
        ? icount
        : this.datatypeModule.int({ min: 5, max: 10 });

    return loremIpsum({ format: "plain", units: "words", count: count });
  }

  /**
   * Generates a word .
   *
   * @example
   * modules.lorem.word() // 'temporibus'
   */
  word(): string {
    return loremIpsum({ format: "plain", units: "words", count: 1 });
  }

  /**
   * Generates a paragraph with the given number of sentences.
   *
   * @param args.count The number of sentences to generate.
   *
   * @example
   * modules.lorem.paragraph()
   *
   */
  paragraph({ count: icount }: ParagraphProps = {}): string {
    const count =
      typeof icount === "number" && icount > 0
        ? icount
        : this.datatypeModule.int({ min: 3, max: 10 });

    return loremIpsum({
      format: "plain",
      paragraphUpperBound: count,
      paragraphLowerBound: count,
      units: "paragraphs",
    });
  }

  /**
   * Generates a single sentence.
   *
   * @param args.wordsMin Minimun of words
   * @param args.wordsMax Maximun of words
   *
   * @example
   * modules.lorem.sentence() // 'Voluptatum cupiditate suscipit autem eveniet aut dolorem aut officiis distinctio.'
   * modules.lorem.sentence(5) // 'Laborum voluptatem officiis est et.'
   * modules.lorem.sentence({ min: 3, max: 5 }) // 'Fugiat repellendus nisi.'
   */
  sentence({ wordsMax, wordsMin }: SentenceProps = {}): string {
    const wordMin =
      typeof wordsMin === "number" && wordsMin > 0 ? wordsMin : undefined;
    const wordMax =
      typeof wordsMax === "number" && wordsMax > 0 ? wordsMax : undefined;

    return loremIpsum({
      format: "plain",
      units: "sentences",
      count: 1,
      sentenceLowerBound: wordMin,
      sentenceUpperBound: wordMax,
    });
  }
}
