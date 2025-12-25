
import { Topic } from './types';

export const CURRICULUM: Topic[] = [
  {
    id: 'anatomy-physiology',
    title: 'Anatomy & Physiology',
    subtopics: [
      {
        id: 'ear-anatomy',
        title: 'Ear Structure',
        subtopics: [
          { id: 'cartilage-healing', title: 'Cartilage Healing Dynamics' },
          { id: 'ear-nerve-endings', title: 'Nerve Bundles & Sensitivity' },
          { id: 'blood-supply-pinna', title: 'Vascularization of the Pinna' }
        ]
      },
      {
        id: 'oral-anatomy',
        title: 'Oral Cavity',
        subtopics: [
          { id: 'frenulum-variations', title: 'Frenulum Variations' },
          { id: 'vascular-tongue', title: 'Tongue Vascularity' },
          { id: 'salivary-ducts', title: 'Salivary Gland Mapping' }
        ]
      },
      {
        id: 'facial-nerves',
        title: 'Facial Nerve Mapping',
        subtopics: [
          { id: 'trigeminal-branching', title: 'Trigeminal Nerve Considerations' },
          { id: 'supraorbital-vessels', title: 'Supraorbital Vessel Avoidance' }
        ]
      }
    ]
  },
  {
    id: 'jewelry-metallurgy',
    title: 'Jewelry & Metallurgy',
    subtopics: [
      {
        id: 'biocompatibility',
        title: 'Biocompatible Materials',
        subtopics: [
          { id: 'titanium-grades', title: 'Titanium: G5 vs G23 vs F136' },
          { id: 'niobium-properties', title: 'Niobium & Anodization' },
          { id: 'gold-karats', title: 'Gold Purity & Nickel Content' }
        ]
      },
      {
        id: 'surface-finish',
        title: 'Finish & Threading',
        subtopics: [
          { id: 'mirror-polish', title: 'The Importance of Mirror Polish' },
          { id: 'threadless-systems', title: 'Threadless (Press-fit) Mechanics' },
          { id: 'internal-threading', title: 'Internal vs External Threading' }
        ]
      }
    ]
  },
  {
    id: 'health-safety',
    title: 'Clinical Protocols',
    subtopics: [
      {
        id: 'sterilization',
        title: 'Sterilization Science',
        subtopics: [
          { id: 'autoclave-cycles', title: 'Steam vs Dry Heat Cycles' },
          { id: 'biological-indicators', title: 'Spore Testing Protocols' },
          { id: 'ultrasonic-cavitation', title: 'Ultrasonic Cleaning Dynamics' }
        ]
      },
      {
        id: 'cross-contamination',
        title: 'Aseptic Technique',
        subtopics: [
          { id: 'gloving-technique', title: 'Clinical Hand Hygiene & Gloving' },
          { id: 'barrier-protection', title: 'Barrier Film & Equipment Covers' }
        ]
      }
    ]
  },
  {
    id: 'advanced-piercing',
    title: 'Masterclass Techniques',
    subtopics: [
      {
        id: 'needle-theory',
        title: 'Advanced Needle Theory',
        subtopics: [
          { id: 'freehand-piercing', title: 'Freehand Technical Execution' },
          { id: 'receiving-tubes', title: 'The Role of Receiving Tubes' },
          { id: 'transfer-methods', title: 'Needle-to-Jewelry Transfers' }
        ]
      },
      {
        id: 'reconstruction',
        title: 'Dermal & Surface',
        subtopics: [
          { id: 'dermal-removal', title: 'Clinical Dermal Removal' },
          { id: 'surface-anchors', title: 'Pocketing & Anchoring Theory' }
        ]
      }
    ]
  }
];

export const PIERCING_ATLAS = [
  { 
    category: 'Ear Cartilage', 
    piercings: ['Helix', 'Forward Helix', 'Tragus', 'Anti-Tragus', 'Conch', 'Rook', 'Daith', 'Industrial', 'Snug', 'Flat', 'Orbital'] 
  },
  { 
    category: 'Ear Lobe', 
    piercings: ['Standard Lobe', 'Stacked Lobe', 'Transverse Lobe', 'Stretched Lobe Maintenance'] 
  },
  { 
    category: 'Nose & Face', 
    piercings: ['Septum', 'Nostril', 'High Nostril', 'Bridge', 'Eyebrow', 'Anti-Eyebrow', 'Third Eye'] 
  },
  { 
    category: 'Lip & Oral', 
    piercings: ['Philtrum (Medusa)', 'Labret', 'Vertical Labret', 'Monroe', 'Madonna', 'Jestrum', 'Ashley', 'Vertical Philtrum', 'Smiley', 'Frowny', 'Tongue', 'Venom'] 
  },
  { 
    category: 'Body & Genital', 
    piercings: ['Navel', 'Floating Navel', 'Nipple', 'Dermal Anchor', 'Surface Bar', 'Christina', 'VCH', 'Prince Albert', 'Triangle', 'Guiche'] 
  }
];
