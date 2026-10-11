import { LegalDocumentView } from '@/components/LegalDocumentView';
import { terms } from '@/legal/terms';

export default function TermsScreen() {
  return <LegalDocumentView doc={terms} />;
}
