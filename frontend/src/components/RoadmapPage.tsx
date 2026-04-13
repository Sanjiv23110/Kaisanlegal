import { useState } from "react";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, MessageCircle, Send } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

interface RoadmapPageProps {
  action: string;
  onBack: () => void;
}

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  documents: string[];
  fees: string;
  timeline: string;
  officialLink?: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export function RoadmapPage({ action, onBack }: RoadmapPageProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; message: string }>>([
    { sender: 'bot', message: 'Hi! I can help you adapt this roadmap based on your specific situation. What questions do you have?' }
  ]);
  const [showChat, setShowChat] = useState(false);

  const roadmapData: Record<string, { name: string; steps: RoadmapStep[] }> = {
    'register-company': {
      name: 'Register a Company',
      steps: [
        {
          id: '1',
          title: 'Choose Company Structure',
          description: 'Decide between Private Limited, LLP, or One Person Company based on your needs.',
          documents: ['Business plan', 'Identity proof', 'Address proof'],
          fees: 'Free (consultation)',
          timeline: '1-2 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Reserve Company Name',
          description: 'Apply for name availability through MCA portal. Choose 2-3 alternative names.',
          documents: ['DIN application', 'Digital signature'],
          fees: '₹1,000',
          timeline: '1-2 days',
          officialLink: 'https://www.mca.gov.in',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Obtain Digital Signature Certificate',
          description: 'Get DSC for all directors and subscribers.',
          documents: ['Identity proof', 'Address proof', 'Photograph'],
          fees: '₹1,500 per person',
          timeline: '1-2 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'File Incorporation Documents',
          description: 'Submit SPICe+ form with all required documents to MCA.',
          documents: ['MOA', 'AOA', 'SPICe+ form', 'Proof of registered office'],
          fees: '₹4,000-10,000',
          timeline: '10-15 days',
          status: 'pending'
        }
      ]
    },
    'file-fir': {
      name: 'File FIR',
      steps: [
        {
          id: '1',
          title: 'Gather Evidence',
          description: 'Collect all relevant documents, photographs, and witness information.',
          documents: ['Evidence materials', 'Witness statements', 'Medical reports (if applicable)'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Visit Police Station',
          description: 'Go to the nearest police station with jurisdiction over the crime location.',
          documents: ['Identity proof', 'Evidence', 'Written complaint'],
          fees: 'Free',
          timeline: '1 day',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'File FIR',
          description: 'Provide detailed information about the incident to the investigating officer.',
          documents: ['Signed FIR copy'],
          fees: 'Free',
          timeline: '1 day',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Follow Up',
          description: 'Regular follow-ups with investigating officer for case progress.',
          documents: ['FIR copy', 'Any additional evidence'],
          fees: 'Free',
          timeline: 'Ongoing',
          status: 'pending'
        }
      ]
    },
    'bail-application' : {
      name: "Bail Application",
      steps: [
        {
          id: '1',
          title: 'Anticipatory Bail',
          description: 'Applied before an arrest occurs',
          documents: ['FIR copy', 'Police notice', 'Personal id & Address Proof', 'Supporting evidence of innocence', 'Affidavit'],
          fees: '15,000-1,50,000',
          timeline: '2-5 weeks',
          status: 'in-progress'
        },
        {
          id: '2',
          title: 'Regular Bail',
          description: 'Applied for after a person is in police or judicial custody.',
          documents: ['FIR copy', 'Vakalatnama', 'Certified copy of Remand Order', 'Surety Documents'],
          fees: '10,000-1,00,000',
          timeline: '1-3 weeks',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Interim Bail',
          description: 'A temporary "stop-gap" bail granted while the main application is pending.',
          documents: ['Same as Regular/Anticipatory', 'Emphasizes on medical/family emergencies (medical certificates, etc.)'],
          fees: '5,000 - 40,000',
          timeline: '1-3 days',
          status: 'in-progress'
        }
      ]
    },
    'chargesheet' : {
      name: "Understand Chargesheet",
      steps: [
        {
          id: '1',
          title: 'For the accused',
          description: 'The accused has a "statutory right" to the chargesheet. The primary duty of the court at the start of a trial is to ensure the accused knows exactly what they are being charged with.',
          documents: ['Vakalatnama or Memo of appearance'],
          fees: 'Free',
          timeline: 'Within 14 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'For the victim',
          description: 'The victim can apply for a Certified Copy from the court’s copying agency by filing a simple "Certified Copy Application" and paying a small fee (usually ₹2–₹5 per page).',
          documents: ['Vakalatnama', 'Copy Application'],
          fees: 'Free',
          timeline: '2-7 days',
          status: 'completed'
        }
      ]
    },
    'police-complaint' : {
      name: 'Police Complaint',
      steps: [
        {
          id: '1',
          title: 'For the accused',
          description: 'In an NC case, the accused often doesnt even know a report has been filed until they receive a court summons or a police call.',
          documents: ['Copy of NCR', 'Anticipatory Bail Application'],
          fees: '2,000 - 7,000',
          timeline: 'Immediate access if you visit the station',
          status: 'in-progress'
        },
        {
          id: '2',
          title: 'For the victim',
          description: 'This is for when you want to report minor offenses like simple verbal abuse, defamation, or a minor scuffle without serious injury.',
          documents: ['Written Complaint (2 copies)', 'ID Proof', 'Supporting Evidence'],
          fees: 'Free',
          timeline: '1-2 hours',
          status: 'in-progress'
        }
      ]
    },
    'wrongful-termination': {
      name: 'Challenge Wrongful Termination',
      steps: [
        {
          id: '1',
          title: 'Document the Termination',
          description: 'Collect all termination-related documents and communications from your employer.',
          documents: ['Termination letter', 'Employment contract', 'Performance reviews', 'Email communications'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Review Employment Contract',
          description: 'Analyze your employment terms, notice period, and termination clauses.',
          documents: ['Employment agreement', 'Company policies', 'HR handbook'],
          fees: 'Free (self-review) or ₹2,000-5,000 (legal consultation)',
          timeline: '2-3 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Send Legal Notice',
          description: 'Issue a formal legal notice to your employer demanding reinstatement or compensation.',
          documents: ['Legal notice draft', 'Supporting evidence', 'Proof of service'],
          fees: '₹5,000-15,000',
          timeline: '7-10 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'File Labor Court Case',
          description: 'If no response, file a case with the appropriate labor court or tribunal.',
          documents: ['Application form', 'Supporting documents', 'Court fees'],
          fees: '₹10,000-50,000',
          timeline: '30-60 days to file',
          officialLink: 'https://labour.gov.in',
          status: 'pending'
        }
      ]
    },
    'wage-dispute': {
      name: 'Recover Unpaid Wages',
      steps: [
        {
          id: '1',
          title: 'Calculate Outstanding Amount',
          description: 'Document all unpaid wages, overtime, bonuses, and statutory benefits.',
          documents: ['Salary slips', 'Bank statements', 'Overtime records', 'Bonus calculations'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Raise Internal Complaint',
          description: 'File a formal complaint with HR department and immediate supervisor.',
          documents: ['Written complaint', 'Proof of submission', 'HR acknowledgment'],
          fees: 'Free',
          timeline: '3-7 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'File Labor Inspector Complaint',
          description: 'Approach the local Labor Inspector if internal complaint fails.',
          documents: ['Complaint application', 'Evidence of wage dues', 'Employment proof'],
          fees: 'Free',
          timeline: '15-30 days',
          officialLink: 'https://labour.gov.in',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Legal Proceedings',
          description: 'File case in Labor Court if Labor Inspector intervention fails.',
          documents: ['Court application', 'All supporting evidence', 'Legal representation'],
          fees: '₹5,000-25,000',
          timeline: '60-90 days',
          status: 'pending'
        }
      ]
    },
    'workplace-harassment': {
      name: 'Address Workplace Harassment',
      steps: [
        {
          id: '1',
          title: 'Document Incidents',
          description: 'Record all harassment incidents with dates, times, witnesses, and evidence.',
          documents: ['Incident diary', 'Screenshots/emails', 'Witness statements', 'Medical reports if applicable'],
          fees: 'Free',
          timeline: 'Ongoing',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Report to Internal Committee',
          description: 'File formal complaint with company\'s Internal Complaints Committee (ICC).',
          documents: ['Written complaint', 'Supporting evidence', 'Witness details'],
          fees: 'Free',
          timeline: '7-10 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'ICC Investigation',
          description: 'Cooperate with ICC investigation process and hearings.',
          documents: ['Additional evidence', 'Statement recordings', 'Medical certificates'],
          fees: 'Free',
          timeline: '90 days (as per POSH Act)',
          status: 'pending'
        },
        {
          id: '4',
          title: 'External Legal Action',
          description: 'If ICC fails to act or you\'re unsatisfied, approach Local Complaints Committee or court.',
          documents: ['ICC complaint copy', 'All evidence', 'Legal representation'],
          fees: '₹10,000-50,000',
          timeline: '30-180 days',
          officialLink: 'https://www.shebox.nic.in',
          status: 'pending'
        }
      ]
    },
    'employment-contract': {
      name: 'Employment Contract Review',
      steps: [
        {
          id: '1',
          title: 'Gather All Documents',
          description: 'Collect your employment letter, contract, appointment letter, and company policies.',
          documents: ['Employment contract', 'Offer letter', 'Company handbook', 'Salary structure'],
          fees: 'Free',
          timeline: '1 day',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Review Key Terms',
          description: 'Understand salary, benefits, job role, termination clauses, and restrictive covenants.',
          documents: ['Contract analysis checklist', 'Industry standard comparisons'],
          fees: 'Free (self-review)',
          timeline: '2-3 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Legal Consultation',
          description: 'Consult with employment lawyer for complex clauses or concerns.',
          documents: ['All employment documents', 'Specific questions list'],
          fees: '₹3,000-10,000',
          timeline: '1-2 hours',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Negotiate Changes',
          description: 'Discuss any unfavorable terms with HR or management if still negotiable.',
          documents: ['Proposed amendments', 'Legal advice summary'],
          fees: 'Free',
          timeline: '1-2 weeks',
          status: 'pending'
        }
      ]
    },
    'pf-gratuity': {
      name: 'Claim PF & Gratuity Benefits',
      steps: [
        {
          id: '1',
          title: 'Check Eligibility',
          description: 'Verify your eligibility for PF withdrawal and gratuity based on service period.',
          documents: ['Service certificate', 'PF account details', 'UAN number'],
          fees: 'Free',
          timeline: '1 day',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Submit PF Withdrawal',
          description: 'File PF withdrawal application online through EPFO portal.',
          documents: ['Form 19/10C', 'Bank details', 'Aadhar/PAN', 'Service certificate'],
          fees: 'Free',
          timeline: '7-15 days',
          officialLink: 'https://www.epfindia.gov.in',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Apply for Gratuity',
          description: 'Submit gratuity application to your employer (if 5+ years service).',
          documents: ['Gratuity application', 'Service certificate', 'Resignation letter'],
          fees: 'Free',
          timeline: '30 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Follow Up & Recovery',
          description: 'Track application status and take legal action if payments are delayed.',
          documents: ['Application receipts', 'Follow-up communications'],
          fees: 'Legal fees if required: ₹5,000-15,000',
          timeline: '30-60 days',
          status: 'pending'
        }
      ]
    },
    'traffic-violation': {
      name: 'Contest Traffic Violation',
      steps: [
        {
          id: '1',
          title: 'Verify the Challan',
          description: 'Check the traffic violation details online using challan number or vehicle registration.',
          documents: ['Challan notice', 'Vehicle RC', 'Driving license'],
          fees: 'Free',
          timeline: '1 day',
          officialLink: 'https://parivahan.gov.in',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Collect Evidence',
          description: 'Gather proof to contest the violation - photos, videos, witness statements, GPS data.',
          documents: ['Dashcam footage', 'Photos of location', 'GPS timestamps', 'Witness details'],
          fees: 'Free',
          timeline: '2-3 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'File Written Objection',
          description: 'Submit formal objection to the issuing authority within 60 days of challan.',
          documents: ['Objection letter', 'Supporting evidence', 'Copy of challan', 'ID proofs'],
          fees: 'Free',
          timeline: '7-15 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Attend Court Hearing',
          description: 'If objection is rejected, appear before traffic court with evidence and legal representation.',
          documents: ['Court notice', 'All evidence', 'Legal documents'],
          fees: '₹2,000-10,000 (legal fees)',
          timeline: '30-90 days',
          status: 'pending'
        }
      ]
    },
    'driving-license': {
      name: 'Driving License Issues',
      steps: [
        {
          id: '1',
          title: 'Check License Status',
          description: 'Verify your license status online and identify the specific issue (expired, suspended, lost).',
          documents: ['Previous license copy', 'Vehicle RC', 'Identity proof'],
          fees: 'Free',
          timeline: '1 day',
          officialLink: 'https://parivahan.gov.in',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Gather Required Documents',
          description: 'Collect necessary documents based on your specific requirement (renewal/restoration/reissue).',
          documents: ['Application form', 'Medical certificate', 'Address proof', 'Passport photos', 'Previous license (if available)'],
          fees: '₹200-1,000',
          timeline: '2-3 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Submit Application',
          description: 'Apply online or visit RTO office to submit documents for license renewal/restoration.',
          documents: ['Filled application form', 'Medical certificate', 'Fees receipt', 'All supporting documents'],
          fees: '₹200-1,500',
          timeline: '7-15 days',
          officialLink: 'https://parivahan.gov.in',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Complete Verification',
          description: 'Appear for biometric verification (if required) and collect renewed/restored license.',
          documents: ['Acknowledgment receipt', 'ID proof'],
          fees: 'Free',
          timeline: '15-30 days',
          status: 'pending'
        }
      ]
    },
    'vehicle-registration': {
      name: 'Vehicle Registration',
      steps: [
        {
          id: '1',
          title: 'Prepare Documentation',
          description: 'Collect all documents required for vehicle registration or transfer of ownership.',
          documents: ['Invoice/Bill of sale', 'Insurance policy', 'PAN card', 'Address proof', 'Form 20 (for new vehicle)', 'Form 29/30 (for transfer)'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Vehicle Inspection',
          description: 'Get your vehicle inspected at RTO (mainly for used vehicles and transfers).',
          documents: ['Vehicle for physical inspection', 'Original documents', 'Previous RC (for transfer)'],
          fees: '₹300-600',
          timeline: '1 day',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Pay Registration Fees',
          description: 'Calculate and pay applicable registration fees, road tax, and other charges.',
          documents: ['Fee receipt', 'Tax calculation sheet'],
          fees: '₹5,000-15,000 (varies by vehicle type and state)',
          timeline: '1-2 days',
          officialLink: 'https://parivahan.gov.in',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Collect RC',
          description: 'Receive temporary registration and collect permanent RC within 30-45 days.',
          documents: ['Acknowledgment receipt', 'Temporary registration'],
          fees: 'Free',
          timeline: '30-45 days',
          status: 'pending'
        }
      ]
    },
    'accident-claim': {
      name: 'Accident Insurance Claim',
      steps: [
        {
          id: '1',
          title: 'Immediate Documentation',
          description: 'Document the accident scene immediately - photos, police report, witness details.',
          documents: ['FIR copy', 'Accident photos', 'Witness statements', 'Medical reports (if injuries)', 'Driver license & RC'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Notify Insurance Company',
          description: 'Inform your insurance company about the accident within 24-48 hours.',
          documents: ['Policy document', 'Accident details', 'FIR copy', 'Contact information'],
          fees: 'Free',
          timeline: '1 day',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'File Claim Application',
          description: 'Submit formal claim with all required documents to insurance company.',
          documents: ['Claim form', 'FIR', 'RC & License copies', 'Repair estimates', 'Medical bills (if applicable)', 'Photos'],
          fees: 'Free',
          timeline: '7-15 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Survey & Settlement',
          description: 'Cooperate with insurance surveyor and get claim settlement or proceed to consumer court if rejected.',
          documents: ['Survey report', 'Final repair bills', 'Settlement documents'],
          fees: 'Deductible as per policy (₹1,000-5,000)',
          timeline: '30-90 days',
          status: 'pending'
        }
      ]
    },
    'vehicle-insurance': {
      name: 'Insurance Dispute Resolution',
      steps: [
        {
          id: '1',
          title: 'Review Policy & Rejection',
          description: 'Carefully read your insurance policy terms and understand the reason for claim rejection or dispute.',
          documents: ['Insurance policy', 'Claim rejection letter', 'All claim documents', 'Email communications'],
          fees: 'Free',
          timeline: '2-3 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Raise Grievance',
          description: 'File formal complaint with insurance company grievance cell and escalate to grievance officer.',
          documents: ['Complaint letter', 'Policy details', 'Claim documents', 'Rejection reasons'],
          fees: 'Free',
          timeline: '15-30 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Approach Insurance Ombudsman',
          description: 'If internal grievance fails, file complaint with Insurance Ombudsman (free process).',
          documents: ['Ombudsman complaint form', 'All previous communications', 'Policy & claim docs'],
          fees: 'Free',
          timeline: '30-60 days',
          officialLink: 'https://www.cioins.co.in',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Consumer Court',
          description: 'As last resort, file case in consumer court for compensation and claim settlement.',
          documents: ['Consumer complaint', 'All evidence', 'Legal representation'],
          fees: '₹5,000-25,000',
          timeline: '6-12 months',
          status: 'pending'
        }
      ]
    },
    'vehicle-theft': {
      name: 'Vehicle Theft FIR & Recovery',
      steps: [
        {
          id: '1',
          title: 'File FIR Immediately',
          description: 'Report vehicle theft to nearest police station within 24 hours with all details.',
          documents: ['RC book copy', 'Insurance policy', 'Driving license', 'Purchase invoice', 'Keys (remaining set)'],
          fees: 'Free',
          timeline: '1 day',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Notify Authorities',
          description: 'Inform RTO, insurance company, and submit copy of FIR to all relevant authorities.',
          documents: ['FIR copy', 'Police acknowledgment', 'Written notifications'],
          fees: 'Free',
          timeline: '2-3 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'File Insurance Claim',
          description: 'Submit theft claim to insurance company with FIR and required documents.',
          documents: ['Claim form', 'FIR copy', 'RC & insurance original', 'NOC from financer (if applicable)', 'All keys'],
          fees: 'Free',
          timeline: '7-15 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Investigation & Settlement',
          description: 'Wait for 90-day investigation period. Claim settlement if vehicle not recovered.',
          documents: ['Non-traceable certificate', 'Final settlement documents'],
          fees: 'As per policy deductible',
          timeline: '90-120 days',
          status: 'pending'
        }
      ]
    },
    'hit-and-run': {
      name: 'Hit and Run Case',
      steps: [
        {
          id: '1',
          title: 'Emergency Response',
          description: 'Call emergency services (108/102), note down vehicle details if possible, and preserve evidence.',
          documents: ['Medical reports', 'Accident photos', 'Witness details', 'CCTV footage (if available)'],
          fees: 'Free',
          timeline: 'Immediate',
          status: 'completed'
        },
        {
          id: '2',
          title: 'File FIR',
          description: 'Register FIR for hit-and-run under IPC Section 279/338 at nearest police station.',
          documents: ['FIR', 'Medical reports', 'Accident evidence', 'Witness statements', 'Vehicle description'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Claim from Motor Accident Fund',
          description: 'Apply for compensation from Hit and Run Motor Accident Fund through MACT.',
          documents: ['MACT application', 'FIR copy', 'Medical documents', 'Income proof', 'Disability certificate (if applicable)'],
          fees: '₹1,000-5,000',
          timeline: '30-60 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Tribunal Hearing',
          description: 'Attend Motor Accident Claims Tribunal hearings and receive compensation (up to ₹2 lakh for death, ₹50k for injury).',
          documents: ['All supporting documents', 'Legal representation', 'Evidence'],
          fees: '₹10,000-50,000 (legal fees)',
          timeline: '6-18 months',
          status: 'pending'
        }
      ]
    },
    'dui-case': {
      name: 'DUI/Drunk Driving Case',
      steps: [
        {
          id: '1',
          title: 'Understand the Charges',
          description: 'Review the challan, breathalyzer test results, and charges under Motor Vehicles Act Section 185.',
          documents: ['Challan copy', 'Breathalyzer report', 'Medical test results', 'Police memo'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Legal Consultation',
          description: 'Consult with a traffic lawyer immediately to understand penalties and defense options.',
          documents: ['All test reports', 'Arrest memo', 'License details', 'Previous violations (if any)'],
          fees: '₹5,000-15,000',
          timeline: '1-3 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Court Appearance',
          description: 'Appear before magistrate. First offense: ₹10,000 fine + 6 months jail. Repeat: ₹15,000 + 2 years jail.',
          documents: ['Court summons', 'Legal representation', 'All evidence', 'Character certificates'],
          fees: '₹10,000-15,000 (fine) + ₹20,000-50,000 (legal fees)',
          timeline: '30-90 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'License Restoration',
          description: 'After serving penalty, apply for license restoration (usually suspended for 6 months minimum).',
          documents: ['Court order', 'Fine payment receipt', 'Medical certificate', 'Driving test (if required)'],
          fees: '₹500-2,000',
          timeline: '6-12 months',
          officialLink: 'https://parivahan.gov.in',
          status: 'pending'
        }
      ]
    },
    'draft-contract': {
      name: 'Draft a Contract',
      steps: [
        {
          id: '1',
          title: 'Define Contract Purpose',
          description: 'Clearly identify the purpose, parties involved, and scope of the agreement.',
          documents: ['Business requirements', 'Party details (names, addresses)', 'Scope of work/services'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Outline Key Terms',
          description: 'Draft essential clauses: payment terms, deliverables, timeline, termination, dispute resolution.',
          documents: ['Payment schedule', 'Deliverables list', 'Timeline/milestones', 'Termination conditions'],
          fees: 'Free (DIY) or ₹3,000-15,000 (lawyer)',
          timeline: '2-5 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Legal Review',
          description: 'Have a lawyer review the draft to ensure legal compliance and protection of your interests.',
          documents: ['Contract draft', 'Supporting documents', 'Specific concerns list'],
          fees: '₹5,000-25,000',
          timeline: '3-7 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Execute & Notarize',
          description: 'Get signatures from all parties on stamp paper and notarize if required.',
          documents: ['Final contract on stamp paper', 'ID proofs', 'Witness details (if required)'],
          fees: '₹100-500 (stamp paper) + ₹500-2,000 (notary)',
          timeline: '1-3 days',
          status: 'pending'
        }
      ]
    },
    'review-contract': {
      name: 'Contract Review',
      steps: [
        {
          id: '1',
          title: 'Initial Reading',
          description: 'Read the entire contract thoroughly to understand the basic terms and obligations.',
          documents: ['Contract copy', 'Related correspondence', 'Previous agreements (if any)'],
          fees: 'Free',
          timeline: '1-2 hours',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Identify Key Clauses',
          description: 'Focus on payment terms, obligations, liability, termination, and dispute resolution clauses.',
          documents: ['Highlighted contract', 'Questions list', 'Industry standards for comparison'],
          fees: 'Free',
          timeline: '2-4 hours',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Professional Analysis',
          description: 'Consult with a contract lawyer to analyze unfavorable terms and hidden risks.',
          documents: ['Complete contract', 'Specific concerns', 'Business objectives'],
          fees: '₹3,000-10,000',
          timeline: '1-3 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Negotiate Changes',
          description: 'Request modifications to unfavorable clauses before signing the agreement.',
          documents: ['Review report', 'Proposed amendments', 'Justification for changes'],
          fees: 'Free',
          timeline: '3-7 days',
          status: 'pending'
        }
      ]
    },
    'breach-of-contract': {
      name: 'Breach of Contract',
      steps: [
        {
          id: '1',
          title: 'Document the Breach',
          description: 'Collect evidence of the contract violation - missed payments, undelivered services, or violated terms.',
          documents: ['Original contract', 'Emails/communications', 'Payment records', 'Delivery receipts', 'Breach evidence'],
          fees: 'Free',
          timeline: '1-3 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Send Legal Notice',
          description: 'Issue a formal legal notice demanding performance or compensation within 15-30 days.',
          documents: ['Legal notice draft', 'Contract copy', 'Evidence of breach', 'Proof of service'],
          fees: '₹3,000-10,000',
          timeline: '7-15 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Attempt Mediation',
          description: 'Try to resolve the dispute through mediation or arbitration as per contract terms.',
          documents: ['Mediation request', 'All documents', 'Settlement proposals'],
          fees: '₹10,000-50,000',
          timeline: '30-60 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'File Lawsuit',
          description: 'If no resolution, file a civil suit for breach of contract claiming damages and specific performance.',
          documents: ['Plaint/petition', 'All evidence', 'Lawyer engagement', 'Court fees'],
          fees: '₹25,000-1,00,000+',
          timeline: '6-18 months',
          status: 'pending'
        }
      ]
    },
    'terminate-contract': {
      name: 'Contract Termination',
      steps: [
        {
          id: '1',
          title: 'Review Termination Clause',
          description: 'Check the contract for termination provisions, notice period, and exit penalties.',
          documents: ['Original contract', 'Amendment documents', 'Previous communications'],
          fees: 'Free',
          timeline: '1 day',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Establish Valid Grounds',
          description: 'Ensure you have valid reasons - breach by other party, force majeure, mutual agreement, or as per terms.',
          documents: ['Evidence for termination reason', 'Communication logs', 'Performance records'],
          fees: 'Free',
          timeline: '2-3 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Send Termination Notice',
          description: 'Issue formal written notice as per contract requirements (registered post/email).',
          documents: ['Termination notice', 'Supporting documents', 'Delivery proof'],
          fees: '₹500-3,000',
          timeline: '7-30 days (as per notice period)',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Settle Outstanding Matters',
          description: 'Clear all pending payments, return materials, and settle final obligations to avoid disputes.',
          documents: ['Settlement statement', 'Payment receipts', 'No-objection certificate'],
          fees: 'As per contract terms',
          timeline: '15-45 days',
          status: 'pending'
        }
      ]
    },
    'nda-agreement': {
      name: 'Non-Disclosure Agreement',
      steps: [
        {
          id: '1',
          title: 'Identify Confidential Information',
          description: 'Define what information needs protection - trade secrets, business plans, client lists, etc.',
          documents: ['List of confidential information', 'Business documentation', 'Parties\' details'],
          fees: 'Free',
          timeline: '1 day',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Choose NDA Type',
          description: 'Select unilateral (one-way) or mutual (two-way) NDA based on information sharing needs.',
          documents: ['Purpose of NDA', 'Scope of disclosure', 'Duration of confidentiality'],
          fees: 'Free',
          timeline: '1 day',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Draft NDA Terms',
          description: 'Include definition of confidential info, obligations, exclusions, term, and consequences of breach.',
          documents: ['NDA template/draft', 'Specific terms', 'Legal consultation notes'],
          fees: '₹2,000-10,000 (lawyer) or Free (templates)',
          timeline: '2-5 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Execute Agreement',
          description: 'Sign the NDA on appropriate stamp paper and exchange signed copies.',
          documents: ['Final NDA on stamp paper', 'ID proofs', 'Witness signatures (if needed)'],
          fees: '₹100-500 (stamp paper)',
          timeline: '1-2 days',
          status: 'pending'
        }
      ]
    },
    'service-agreement': {
      name: 'Service Agreement',
      steps: [
        {
          id: '1',
          title: 'Define Service Scope',
          description: 'Clearly outline services to be provided, deliverables, timelines, and quality standards.',
          documents: ['Service description', 'Deliverables list', 'Timeline/milestones', 'Quality metrics'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Set Payment Terms',
          description: 'Establish payment structure - fixed fee, hourly rate, milestones, payment schedule, and penalties.',
          documents: ['Payment schedule', 'Invoice terms', 'Late payment penalties', 'Tax details'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Add Legal Protections',
          description: 'Include intellectual property rights, liability limitations, confidentiality, and termination clauses.',
          documents: ['IP ownership terms', 'Liability caps', 'Confidentiality clause', 'Termination terms'],
          fees: '₹3,000-15,000 (legal drafting)',
          timeline: '3-7 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Sign Agreement',
          description: 'Execute the agreement on stamp paper with both parties\' signatures.',
          documents: ['Final agreement on stamp paper', 'ID proofs', 'Business registration documents'],
          fees: '₹100-500 (stamp paper)',
          timeline: '1-2 days',
          status: 'pending'
        }
      ]
    },
    'contract-dispute': {
      name: 'Contract Dispute Resolution',
      steps: [
        {
          id: '1',
          title: 'Assess the Dispute',
          description: 'Identify the exact nature of disagreement and review contract dispute resolution clause.',
          documents: ['Original contract', 'Dispute documentation', 'Communication records', 'Legal opinion'],
          fees: 'Free (self) or ₹3,000-10,000 (lawyer)',
          timeline: '2-3 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Negotiate Directly',
          description: 'Attempt good-faith negotiations with the other party to reach amicable settlement.',
          documents: ['Discussion points', 'Settlement proposals', 'Written communications'],
          fees: 'Free',
          timeline: '7-15 days',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Mediation/Arbitration',
          description: 'Use mediation or arbitration as specified in contract or mutually agreed upon.',
          documents: ['Mediation/arbitration application', 'Contract copy', 'All evidence', 'Mediator appointment'],
          fees: '₹20,000-1,00,000',
          timeline: '2-6 months',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Court Litigation',
          description: 'As last resort, file civil suit in appropriate court for contract enforcement or damages.',
          documents: ['Plaint/petition', 'Complete documentation', 'Legal representation', 'Court fees'],
          fees: '₹50,000-2,00,000+',
          timeline: '1-3 years',
          status: 'pending'
        }
      ]
    },
    'contract-amendment': {
      name: 'Contract Amendment',
      steps: [
        {
          id: '1',
          title: 'Identify Required Changes',
          description: 'Document specific terms that need modification and reasons for amendment.',
          documents: ['Original contract', 'Proposed changes list', 'Justification for amendments'],
          fees: 'Free',
          timeline: '1-2 days',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Check Amendment Clause',
          description: 'Review the contract for amendment provisions and required procedures.',
          documents: ['Contract amendment clause', 'Previous amendments (if any)', 'Legal review'],
          fees: 'Free',
          timeline: '1 day',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Draft Amendment Agreement',
          description: 'Prepare formal amendment document clearly stating changes to original contract.',
          documents: ['Amendment draft', 'Original contract reference', 'Specific clause modifications'],
          fees: '₹2,000-8,000 (lawyer)',
          timeline: '3-5 days',
          status: 'pending'
        },
        {
          id: '4',
          title: 'Execute Amendment',
          description: 'Get all parties to sign the amendment on stamp paper and attach to original contract.',
          documents: ['Amendment agreement on stamp paper', 'All parties\' signatures', 'Original contract copy'],
          fees: '₹100-300 (stamp paper)',
          timeline: '1-3 days',
          status: 'pending'
        }
      ]
    },
    'divorce': {
      name: 'Divorce Proceedings',
      steps: [
        {
          id: '1',
          title: 'Mutual Agreement',
          description: 'This is the most efficient way to dissolve a marriage if both partners agree on all terms (alimony, custody, and assets).',
          documents: ['Marriage Certificate', 'Joint Petition', 'Settlement MoU', 'ID Proofs'],
          fees: '15,000-50,000',
          timeline: '6-18 months',
          status: 'in-progress'
        },
        {
          id: '2',
          title: 'Contested Divorce',
          description: 'This occurs when one spouse wants a divorce but the other does not, or they cannot agree on terms. It requires proving specific "grounds" (e.g., Cruelty, Adultery, Desertion).',
          documents: ['Evidence of grounds', 'Income statement', 'FIRs (if any)'],
          fees: '50,000-5,00,000+',
          timeline: '3-10+ years',
          status: 'in-progress'
        }
      ]
    },
    'child-custody': {
      name: 'Child Custody',
      steps: [
        {
          id: '1',
          title: 'Physical Custody',
          description: 'This is the most common arrangement where the child resides primarily with one parent (the "custodial parent"), while the other parent has visitation rights.',
          documents: ['Site map of home', 'School proximity proof'],
          fees: '30,000-1,00,000',
          timeline: '6months-2years',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Joint Custody',
          description: 'The child spends significant time (e.g., alternating weeks or 4-3 day splits) with both parents.',
          documents: ['Detailed parenting plan'],
          fees: '40,000-1,50,000',
          timeline: '1-2years',
          status: 'completed'
        },
        {
          id: '3',
          title: 'Legal Custody',
          description: 'This is about Decision-Making Power (schooling, surgery, religion). In India, even if one parent has physical custody, Joint Legal Custody is the default unless one parent is proven unfit (e.g., addiction or history of violence).',
          documents: ['Education & Medical Records'],
          fees: 'Part of main custody package',
          timeline: 'Decided along with final decree',
          status: 'completed'
        },
        {
          id: '4',
          title: 'Sole Custody',
          description: 'This is an "exception" where one parent gets both physical and legal custody, often excluding the other parent from major decisions due to safety concerns.',
          documents: ['Affidavits from 3rd parties', 'Police reports (if any)'],
          fees: '50,000-2,00,000+',
          timeline: '1.5-3years',
          status: 'completed'
        },
      ]
    }
  };

  const currentRoadmap = roadmapData[action];

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessages = [
      ...chatMessages,
      { sender: 'user' as const, message: chatInput },
      { 
        sender: 'bot' as const, 
        message: generateBotResponse(chatInput, action)
      }
    ];
    
    setChatMessages(newMessages);
    setChatInput('');
  };

  const generateBotResponse = (input: string, actionType: string) => {
    const responses: Record<string, string[]> = {
      'register-company': [
        'For company registration, I recommend starting with a Private Limited Company for better credibility and investment opportunities.',
        'Make sure to have at least 2 directors and 2 shareholders. The registered office address is mandatory.',
        'If you face any delays, you can escalate through the MCA grievance portal or contact a chartered accountant.'
      ],
      'file-fir': [
        'If the police refuse to file your FIR, you have the right to approach the Superintendent of Police or file a complaint with the Magistrate under Section 156(3).',
        'Always insist on getting a copy of the FIR immediately after filing. This is your legal right.',
        'For serious crimes, you can also send a copy to the District Collector and local human rights commission.'
      ],
      'wrongful-termination': [
        'Remember to check if you received proper notice period as per your employment contract or labor laws. Sudden termination without notice may be wrongful.',
        'If terminated for misconduct, ensure you received a proper show-cause notice and opportunity to explain before termination.',
        'Keep all performance reviews and communications that show your good standing at work - these will be crucial evidence.',
        'Consider negotiating a settlement before filing a legal case, as litigation can be time-consuming and expensive.'
      ],
      'wage-dispute': [
        'Document everything - salary slips, bank statements, work hours, overtime records. Strong documentation is key to winning wage disputes.',
        'Check if your employer is covered under the Payment of Wages Act - it mandates wage payment within 7-10 days of due date.',
        'Calculate interest on delayed wages as per labor laws - you may be entitled to compensation beyond just the unpaid wages.',
        'Try internal grievance mechanisms first, but don\'t delay too long as there are limitation periods for wage claims.'
      ],
      'workplace-harassment': [
        'Sexual harassment cases must be reported within 3 months of the incident as per POSH Act 2013. Don\'t delay in filing complaints.',
        'If your company doesn\'t have an ICC or it has less than 10 employees, you can directly approach the Local Complaints Committee.',
        'Maintain detailed records with dates, times, witnesses. Screenshots of messages and emails are crucial evidence.',
        'You have the right to ask for interim relief during investigation, including transfer of the harasser or yourself.'
      ],
      'employment-contract': [
        'Pay attention to non-compete and confidentiality clauses - some may be legally unenforceable if too broad or restrictive.',
        'Check if the notice period mentioned is reasonable and as per industry standards. Very long notice periods may be challenged.',
        'Understand your probation period rights - termination during probation has different rules than regular employment.',
        'Look for arbitration clauses that may limit your right to approach courts for disputes.'
      ],
      'pf-gratuity': [
        'You can withdraw PF for unemployment, medical treatment, education, or house purchase even before retirement.',
        'Gratuity is mandatory for companies with 10+ employees if you\'ve completed 5 years of service. Calculate 15 days\' salary for each year.',
        'Use the EPFO mobile app or website for faster PF processing. Most withdrawals are now processed within 3-7 days.',
        'If your employer delays PF or gratuity payment, you can file a complaint with EPFO enforcement officer.'
      ],
      'traffic-violation': [
        'If the traffic police refuse to file your challan, you can file a complaint with the Superintendent of Police or the Magistrate.',
        'Always keep a copy of the challan and any evidence you have. This is your legal right.',
        'For serious violations, you can also file a complaint with the District Collector and local human rights commission.'
      ],
      'driving-license': [
        'Check your license status online and identify the specific issue (expired, suspended, lost).',
        'Collect necessary documents based on your specific requirement (renewal/restoration/reissue).',
        'Apply online or visit RTO office to submit documents for license renewal/restoration.',
        'Appear for biometric verification (if required) and collect renewed/restored license.'
      ],
      'vehicle-registration': [
        'Collect all documents required for vehicle registration or transfer of ownership.',
        'Get your vehicle inspected at RTO (mainly for used vehicles and transfers).',
        'Calculate and pay applicable registration fees, road tax, and other charges.',
        'Receive temporary registration and collect permanent RC within 30-45 days.'
      ],
      'accident-claim': [
        'Document the accident scene immediately - photos, police report, witness details.',
        'Inform your insurance company about the accident within 24-48 hours.',
        'Submit formal claim with all required documents to insurance company.',
        'Cooperate with insurance surveyor and get claim settlement or proceed to consumer court if rejected.'
      ],
      'vehicle-insurance': [
        'Carefully read your insurance policy terms and understand the reason for claim rejection or dispute.',
        'File formal complaint with insurance company grievance cell and escalate to grievance officer.',
        'If internal grievance fails, file complaint with Insurance Ombudsman (free process).',
        'As last resort, file case in consumer court for compensation and claim settlement.'
      ],
      'vehicle-theft': [
        'Report vehicle theft to nearest police station within 24 hours with all details.',
        'Inform RTO, insurance company, and submit copy of FIR to all relevant authorities.',
        'Submit theft claim to insurance company with FIR and required documents.',
        'Wait for 90-day investigation period. Claim settlement if vehicle not recovered.'
      ],
      'hit-and-run': [
        'Call emergency services (108/102), note down vehicle details if possible, and preserve evidence.',
        'Register FIR for hit-and-run under IPC Section 279/338 at nearest police station.',
        'Apply for compensation from Hit and Run Motor Accident Fund through MACT.',
        'Attend Motor Accident Claims Tribunal hearings and receive compensation (up to ₹2 lakh for death, ₹50k for injury).'
      ],
      'dui-case': [
        'Review the challan, breathalyzer test results, and charges under Motor Vehicles Act Section 185.',
        'Consult with a traffic lawyer immediately to understand penalties and defense options.',
        'Appear before magistrate. First offense: ₹10,000 fine + 6 months jail. Repeat: ₹15,000 + 2 years jail.',
        'After serving penalty, apply for license restoration (usually suspended for 6 months minimum).'
      ],
      'draft-contract': [
        'Start by clearly defining the purpose, parties involved, and scope of the agreement.',
        'Draft essential clauses such as payment terms, deliverables, timeline, termination, and dispute resolution.',
        'Have a lawyer review the draft to ensure legal compliance and protection of your interests.',
        'Get signatures from all parties on stamp paper and notarize if required.'
      ],
      'review-contract': [
        'Read the entire contract thoroughly to understand the basic terms and obligations.',
        'Focus on key clauses like payment terms, obligations, liability, termination, and dispute resolution.',
        'Consult with a contract lawyer to analyze unfavorable terms and hidden risks.',
        'Request modifications to unfavorable clauses before signing the agreement.'
      ],
      'breach-of-contract': [
        'Collect evidence of the contract violation - missed payments, undelivered services, or violated terms.',
        'Issue a formal legal notice demanding performance or compensation within 15-30 days.',
        'Try to resolve the dispute through mediation or arbitration as per contract terms.',
        'If no resolution, file a civil suit for breach of contract claiming damages and specific performance.'
      ],
      'terminate-contract': [
        'Check the contract for termination provisions, notice period, and exit penalties.',
        'Ensure you have valid reasons - breach by other party, force majeure, mutual agreement, or as per terms.',
        'Issue formal written notice as per contract requirements (registered post/email).',
        'Clear all pending payments, return materials, and settle final obligations to avoid disputes.'
      ],
      'nda-agreement': [
        'Define what information needs protection - trade secrets, business plans, client lists, etc.',
        'Select unilateral (one-way) or mutual (two-way) NDA based on information sharing needs.',
        'Include definition of confidential info, obligations, exclusions, term, and consequences of breach.',
        'Sign the NDA on appropriate stamp paper and exchange signed copies.'
      ],
      'service-agreement': [
        'Clearly outline services to be provided, deliverables, timelines, and quality standards.',
        'Establish payment structure - fixed fee, hourly rate, milestones, payment schedule, and penalties.',
        'Include intellectual property rights, liability limitations, confidentiality, and termination clauses.',
        'Execute the agreement on stamp paper with both parties\' signatures.'
      ],
      'contract-dispute': [
        'Identify the exact nature of disagreement and review contract dispute resolution clause.',
        'Attempt good-faith negotiations with the other party to reach amicable settlement.',
        'Use mediation or arbitration as specified in contract or mutually agreed upon.',
        'As last resort, file civil suit in appropriate court for contract enforcement or damages.'
      ],
      'contract-amendment': [
        'Document specific terms that need modification and reasons for amendment.',
        'Review the contract for amendment provisions and required procedures.',
        'Prepare formal amendment document clearly stating changes to original contract.',
        'Get all parties to sign the amendment on stamp paper and attach to original contract.'
      ]
    };

    const actionResponses = responses[actionType] || ['I can help you adapt this roadmap based on your specific situation. Could you provide more details about your concern?'];
    return actionResponses[Math.floor(Math.random() * actionResponses.length)];
  };

  if (!currentRoadmap) {
    return (
      <div className="pt-20 p-6 pb-8">
        <div className="max-w-md mx-auto text-center">
          <p>Roadmap not found</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={20} className="text-green-600" />;
      case 'in-progress': return <Clock size={20} className="text-blue-600" />;
      default: return <AlertCircle size={20} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-l-green-500 bg-green-50';
      case 'in-progress': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-background pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Actions
          </Button>
          <h1 className="text-3xl font-bold mb-2">{currentRoadmap.name}</h1>
          <p className="text-blue-100">Follow these steps to complete your legal process</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Roadmap Steps - Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {currentRoadmap.steps.map((step, index) => (
              <Card key={step.id} className="overflow-hidden">
                <div className={`p-1 ${
                  step.status === 'completed' ? 'bg-green-100' :
                  step.status === 'in-progress' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <div className="bg-white p-6">
                    <div className="flex items-start gap-4">
                      {/* Step Number */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        step.status === 'completed' ? 'bg-green-500 text-white' :
                        step.status === 'in-progress' ? 'bg-blue-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                            <Badge variant={
                              step.status === 'completed' ? 'default' :
                              step.status === 'in-progress' ? 'secondary' : 'outline'
                            } className="gap-1">
                              {step.status === 'completed' && <CheckCircle size={14} />}
                              {step.status === 'in-progress' && <Clock size={14} />}
                              {step.status === 'pending' && <AlertCircle size={14} />}
                              {step.status === 'completed' ? 'Completed' :
                               step.status === 'in-progress' ? 'In Progress' : 'Pending'}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4">{step.description}</p>

                        {/* Step Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock size={16} className="text-blue-600" />
                              <span className="text-sm font-medium">Timeline</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{step.timeline}</p>
                          </div>

                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-green-600 font-bold">₹</span>
                              <span className="text-sm font-medium">Fees</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{step.fees}</p>
                          </div>

                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle size={16} className="text-purple-600" />
                              <span className="text-sm font-medium">Documents</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{step.documents.length} required</p>
                          </div>
                        </div>

                        {/* Documents List */}
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Required Documents:</p>
                          <div className="flex flex-wrap gap-2">
                            {step.documents.map((doc, docIndex) => (
                              <Badge key={docIndex} variant="outline" className="text-xs">
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Official Link */}
                        {step.officialLink && (
                          <Button variant="outline" size="sm" className="w-full md:w-auto">
                            Visit Official Website →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sidebar - Chatbot */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle size={20} />
                    <h3 className="font-semibold">AI Assistant</h3>
                  </div>
                  <p className="text-xs text-purple-100">Get personalized guidance for your situation</p>
                </div>

                <div className="p-4">
                  {/* Chat Messages */}
                  <div className="h-64 overflow-y-auto mb-4 space-y-3 pr-2">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            msg.sender === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a question..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && chatInput.trim()) {
                          setChatMessages([...chatMessages, 
                            { sender: 'user', message: chatInput },
                            { sender: 'bot', message: "That's a great question! Let me help you understand this better. Based on your specific situation, I recommend..." }
                          ]);
                          setChatInput('');
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={() => {
                        if (chatInput.trim()) {
                          setChatMessages([...chatMessages, 
                            { sender: 'user', message: chatInput },
                            { sender: 'bot', message: "That's a great question! Let me help you understand this better. Based on your specific situation, I recommend..." }
                          ]);
                          setChatInput('');
                        }
                      }}
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Legal Disclaimer */}
              <Card className="mt-4 bg-amber-50 border-amber-200">
                <div className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs font-medium text-amber-900 mb-1">Legal Disclaimer</p>
                      <p className="text-xs text-amber-800">
                        This roadmap provides general guidance. Always consult with a qualified attorney for advice specific to your situation.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}