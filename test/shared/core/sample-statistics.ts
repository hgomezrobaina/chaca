interface Result {
  mean: number;
  variance: number;
}

export class SampleStatistics {
  static execute(samples: number[]): Result {
    const n = samples.length;
    const mean = samples.reduce((sum, value) => sum + value, 0) / n;
    const variance =
      samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n;

    return { mean, variance };
  }
}
