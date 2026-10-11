import { LegalDocumentView } from '@/components/LegalDocumentView';
import { privacy } from '@/legal/privacy';

export default function PrivacyScreen() {
  return <LegalDocumentView doc={privacy} />;
}
