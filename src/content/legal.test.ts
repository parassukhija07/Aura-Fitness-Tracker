import { PRIVACY_POLICY, TERMS_OF_SERVICE, LEGAL_CONTACT } from './legal';

describe('legal content', () => {
  const docs = { privacy: PRIVACY_POLICY, terms: TERMS_OF_SERVICE };

  for (const [name, sections] of Object.entries(docs)) {
    test(`${name} has sections, each with a heading and non-empty body`, () => {
      expect(sections.length).toBeGreaterThan(3);
      for (const s of sections) {
        expect(s.heading.trim().length).toBeGreaterThan(0);
        expect(s.body.length).toBeGreaterThan(0);
        s.body.forEach((p) => expect(p.trim().length).toBeGreaterThan(0));
      }
    });

    test(`${name} exposes a contact path`, () => {
      const blob = sections.flatMap((s) => s.body).join(' ');
      expect(blob).toContain(LEGAL_CONTACT);
    });
  }

  test('terms include a not-medical-advice disclaimer', () => {
    const blob = TERMS_OF_SERVICE.flatMap((s) => s.body).join(' ').toLowerCase();
    expect(blob).toContain('not medical advice');
  });

  test('privacy covers export and deletion (GDPR rights)', () => {
    const blob = PRIVACY_POLICY.flatMap((s) => s.body).join(' ').toLowerCase();
    expect(blob).toContain('export');
    expect(blob).toMatch(/delet|eras/);
  });
});
