import { Sheet } from '../../design/Sheet';
import type { LegalSection } from '../../content/legal';
import { LEGAL_EFFECTIVE } from '../../content/legal';

interface LegalSheetProps {
  open: boolean;
  title: string;
  sections: LegalSection[];
  onClose: () => void;
}

export function LegalSheet({ open, title, sections, onClose }: LegalSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title} detents="large">
      <div className="legal">
        <p className="legal__effective">Effective {LEGAL_EFFECTIVE}</p>
        {sections.map((section) => (
          <section className="legal__section" key={section.heading}>
            <h3 className="legal__heading">{section.heading}</h3>
            {section.body.map((para, i) => (
              <p className="legal__para" key={i}>{para}</p>
            ))}
          </section>
        ))}
      </div>
    </Sheet>
  );
}
