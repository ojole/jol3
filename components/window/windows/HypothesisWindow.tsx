'use client'

interface HypothesisWindowProps {
  type: 'fishbowl' | 'dark-planet' | 'lidar'
}

export default function HypothesisWindow({ type }: HypothesisWindowProps) {
  const content = {
    fishbowl: {
      title: 'The Fishbowl Hypothesis',
      intro: 'A thought experiment about observable reality and perception boundaries.',
      sections: [
        {
          heading: 'Core Premise',
          text: 'What if our perceived universe is not infinite, but rather a bounded observable space—a "fishbowl"—beyond which lies something fundamentally different or unknowable?',
        },
        {
          heading: 'Implications',
          text: 'If true, this would suggest that our scientific observations are inherently limited not by technology, but by the structure of reality itself. We may be measuring the walls of the bowl, not the ocean beyond.',
        },
        {
          heading: 'Connection to AI',
          text: 'Language models operate within bounded training data—their "fishbowl." They cannot perceive or reason about information outside that boundary, yet they produce coherent outputs that seem to understand a broader reality.',
        },
        {
          heading: 'Open Questions',
          text: 'How do we distinguish between the limits of our tools and the limits of what exists? Can a system recognize its own boundaries?',
        },
      ],
    },
    'dark-planet': {
      title: 'The Dark Planet Hypothesis',
      intro: 'Exploring the possibility of undetectable celestial bodies and dark matter manifestations.',
      sections: [
        {
          heading: 'Observation',
          text: 'We detect planets primarily through gravitational effects, light reflection, or transit dimming. But what if there are planetary bodies that don\'t interact with electromagnetic radiation in detectable ways?',
        },
        {
          heading: 'Dark Matter Connection',
          text: 'If dark matter can clump and form structures, could it form planet-like objects invisible to our telescopes? These "dark planets" would have mass and gravity but no light signature.',
        },
        {
          heading: 'Detection Challenges',
          text: 'Traditional astronomy relies on light. Detecting a dark planet would require measuring gravitational lensing or unexplained orbital perturbations—indirect evidence of something invisible.',
        },
        {
          heading: 'Speculative Applications',
          text: 'This mirrors AI alignment challenges: how do we detect and measure systems whose internal states are fundamentally opaque to our instruments?',
        },
      ],
    },
    lidar: {
      title: 'LiDAR-Emoji Semantic Mapping',
      intro: 'A framework for encoding spatial and semantic information using emoji as a compressed symbolic language.',
      sections: [
        {
          heading: 'Concept',
          text: 'LiDAR generates dense 3D point clouds. Emojis are culturally-rich, compact symbols. What if we could map spatial features to emoji representations to create a human-readable spatial encoding system?',
        },
        {
          heading: 'Use Case: Accessibility',
          text: 'Imagine a system that describes a LiDAR-scanned room using emojis: 🛋️📺🪴🚪. A visually impaired person could "read" the spatial layout through tactile or audio emoji interpretation.',
        },
        {
          heading: 'Semantic Compression',
          text: 'Emojis carry cultural meaning beyond their visual appearance. A 🏠 isn\'t just a house shape—it implies safety, shelter, domesticity. Mapping spatial data to emoji creates a semantically enriched, compressed representation.',
        },
        {
          heading: 'Technical Challenge',
          text: 'How do you train a model to recognize 3D features and map them to culturally-appropriate emoji? This requires both computer vision and cultural reasoning—a multimodal AI challenge.',
        },
        {
          heading: 'EMCRYPTED Connection',
          text: 'This hypothesis informs the design of emoji-based puzzle systems that test cultural reasoning and spatial logic simultaneously.',
        },
      ],
    },
  }

  const data = content[type]

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3">{data.title}</h1>
        <p className="text-lg text-[var(--color-text-secondary)] italic">
          {data.intro}
        </p>
      </div>

      <div className="space-y-6">
        {data.sections.map((section, idx) => (
          <section key={idx} className="border-l-4 border-[var(--color-accent-primary)] pl-4">
            <h2 className="text-lg font-bold mb-2 text-[var(--color-text-primary)]">
              {section.heading}
            </h2>
            <p className="text-[var(--color-text-primary)] leading-relaxed">
              {section.text}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-8 p-4 bg-[var(--color-paper-dark)] border border-[var(--color-border-light)] rounded">
        <p className="text-xs text-[var(--color-text-secondary)] italic">
          💭 <strong>Note:</strong> These are speculative thought experiments designed to explore edge cases in perception, detection, and symbolic reasoning. They inform my approach to AI system design and user experience.
        </p>
      </div>
    </div>
  )
}
