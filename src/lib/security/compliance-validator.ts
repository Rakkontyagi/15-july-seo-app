
export class ComplianceValidator {
  private rules: any;

  constructor(rules: any) {
    this.rules = rules;
  }

  validate(data: any) {
    const errors: string[] = [];

    for (const key in this.rules) {
      if (this.rules.hasOwnProperty(key)) {
        const rule = this.rules[key];
        if (rule.required && !data[key]) {
          errors.push(`${key} is required.`);
        }
      }
    }

    return errors;
  }
}
