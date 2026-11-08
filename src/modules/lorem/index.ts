import { loremIpsum } from "lorem-ipsum";
import { DatatypeModule } from "../datatype";
import { Language, LanguageProps } from "../../core/locale/language";
import { LocaleCategoryResolver } from "../../core/locale/locale-category-resolver";

export type WordsProps = LanguageProps & {
  count?: number;
};

export type ParagraphProps = LanguageProps & {
  count?: number;
};

export type SlugProps = LanguageProps & {
  wordCount?: number;
};

export type SentencesProps = LanguageProps & {
  sentencesCount?: number;
  separator?: string;
  wordsMax?: number;
  wordsMin?: number;
};

export type SentenceProps = LanguageProps & {
  wordsMax?: number;
  wordsMin?: number;
};

export type ParagraphsProps = LanguageProps & {
  paragraphsCount?: number;
  separator?: string;
  minSentences?: number;
  maxSentences?: number;
};

export class LoremModule {
  constructor(
    private readonly datatypeModule: DatatypeModule,
    private readonly locales: LocaleCategoryResolver,
  ) {}

  /** The vocabulary `lorem-ipsum` draws from for a registered locale. */
  private vocabulary(language: Language | undefined): string[] {
    return this.locales.execute({
      language,
      select: (locale) => locale.lorem.words,
    });
  }

  /**
   * @param args.paragraphsCount Number of paragraphs. Default `3`
   * @param args.separator Separator between paragraphs. Default `\n`
   * @param args.maxSentences Maximun of sentences of each paragraphs
   * @param args.minSentences Min of sentences of each paragraphs
   * @param args.language Locale to read the vocabulary from. Defaults `en`
   *
   * @example modules.lorem.paragraphs()
   * @returns string
   */
  paragraphs({
    maxSentences,
    minSentences,
    paragraphsCount,
    separator: iseparator,
    language,
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
      words: this.vocabulary(language),
    });
  }

  /**
   * @param args.sentencesCount Number of sentences. Default in `3`
   * @param args.separator Separator between sentences. Default `\n`
   * @param args.wordsMin Minimun of words in each sentence
   * @param args.wordsMax Maximun of words in each sentence
   * @param args.language Locale to read the vocabulary from. Defaults `en`
   *
   * @example modules.lorem.sentences()
   * @returns
   */
  sentences({
    sentencesCount,
    separator: iseparator,
    wordsMax,
    wordsMin,
    language,
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
      words: this.vocabulary(language),
    });
  }

  /**
   * @param args.wordCount Number of words in the slug. Default `3`
   * @param args.language Locale to read the vocabulary from. Defaults `en`
   * @example modules.lorem.slug() // 'lorem-ipsum-ad'
   * @returns string
   */
  slug({ wordCount, language }: SlugProps = {}): string {
    const cant = typeof wordCount === "number" && wordCount > 0 ? wordCount : 3;

    const words = loremIpsum({
      format: "plain",
      count: cant,
      units: "words",
      words: this.vocabulary(language),
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
   * @param args.language Locale to read the vocabulary from. Defaults `en`
   * @example modules.lorem.words() // 'lorem ipsum in'
   * @returns string
   */
  words({ count: icount, language }: WordsProps = {}): string {
    const count =
      typeof icount === "number" && icount >= 0
        ? icount
        : this.datatypeModule.int({ min: 5, max: 10 });

    return loremIpsum({
      format: "plain",
      units: "words",
      count: count,
      words: this.vocabulary(language),
    });
  }

  /**
   * Generates a word from a registered locale's vocabulary.
   *
   * @param args.language Locale to read the vocabulary from. Defaults `en`
   * @example
   * modules.lorem.word() // 'temporibus'
   */
  word({ language }: LanguageProps = {}): string {
    return loremIpsum({
      format: "plain",
      units: "words",
      count: 1,
      words: this.vocabulary(language),
    });
  }

  /**
   * Generates a paragraph with the given number of sentences.
   *
   * @param args.count The number of sentences to generate.
   * @param args.language Locale to read the vocabulary from. Defaults `en`
   *
   * @example
   * modules.lorem.paragraph()
   *
   */
  paragraph({ count: icount, language }: ParagraphProps = {}): string {
    const count =
      typeof icount === "number" && icount > 0
        ? icount
        : this.datatypeModule.int({ min: 3, max: 10 });

    return loremIpsum({
      format: "plain",
      paragraphUpperBound: count,
      paragraphLowerBound: count,
      units: "paragraphs",
      words: this.vocabulary(language),
    });
  }

  /**
   * Generates a single sentence.
   *
   * @param args.wordsMin Minimun of words
   * @param args.wordsMax Maximun of words
   * @param args.language Locale to read the vocabulary from. Defaults `en`
   *
   * @example
   * modules.lorem.sentence() // 'Voluptatum cupiditate suscipit autem eveniet aut dolorem aut officiis distinctio.'
   * modules.lorem.sentence(5) // 'Laborum voluptatem officiis est et.'
   * modules.lorem.sentence({ min: 3, max: 5 }) // 'Fugiat repellendus nisi.'
   */
  sentence({ wordsMax, wordsMin, language }: SentenceProps = {}): string {
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
      words: this.vocabulary(language),
    });
  }
}
