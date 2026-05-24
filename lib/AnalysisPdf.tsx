import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { AnalysisResult, ClauseItem } from "@/lib/types";

// React-PDF document for the structured analysis. Uses built-in Helvetica
// (no font registration needed → smaller bundle, identical render in every
// PDF viewer). Brand colours from the KnowUrPolicy design system.
//
// Colours pinned here (don't import from tailwind config — that's a TS
// module react-pdf can't introspect at runtime).
const NAVY = "#0A2540";
const NAVY_MID = "#15406B";
const AMBER = "#C96A00";
const CREAM = "#FAF8F5";
const GREEN_TEXT = "#0A6640";
const GREEN_BG = "#E8F7EF";
const YELLOW_TEXT = "#7A5500";
const YELLOW_BG = "#FFF8DC";
const YELLOW_BORDER = "#B07800";
const RED_TEXT = "#A01515";
const RED_BG = "#FEF0F0";
const INK_12 = "#E2DCD3";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: NAVY,
    backgroundColor: CREAM,
  },

  // Header
  header: { marginBottom: 20 },
  brand: { fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 4 },
  brandAccent: { color: AMBER },
  filename: {
    fontSize: 18,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 6,
  },
  meta: { fontSize: 9, color: NAVY_MID, marginBottom: 12 },

  // Complexity card
  complexityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: INK_12,
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  complexityScore: {
    fontSize: 32,
    fontWeight: 700,
    color: AMBER,
    marginRight: 14,
  },
  complexityLabelLine: {
    fontSize: 11,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 4,
  },
  complexityNote: { fontSize: 9, color: NAVY_MID, lineHeight: 1.4 },

  // Summary
  summaryBox: {
    backgroundColor: "#FFFFFF",
    borderColor: INK_12,
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 18,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: AMBER,
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryText: { fontSize: 10.5, color: NAVY, lineHeight: 1.5 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: NAVY,
    marginRight: 8,
  },
  sectionCount: {
    fontSize: 9,
    fontWeight: 700,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Clause card
  clauseCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderColor: INK_12,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 6,
  },
  stripe: { width: 3 },
  clauseBody: { flex: 1, paddingVertical: 8, paddingHorizontal: 10 },
  clauseTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 3,
  },
  clauseText: { fontSize: 9, color: NAVY_MID, lineHeight: 1.45 },

  // Footer / disclaimer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    paddingTop: 8,
    borderTopColor: "#F1E4D0",
    borderTopWidth: 1,
  },
  disclaimer: {
    fontSize: 8,
    color: AMBER,
    lineHeight: 1.5,
  },
  footerMeta: {
    fontSize: 7,
    color: NAVY_MID,
    marginTop: 4,
  },
});

function toneStyle(tone: "green" | "yellow" | "red") {
  switch (tone) {
    case "green":
      return { stripe: GREEN_TEXT, bg: GREEN_BG, text: GREEN_TEXT };
    case "yellow":
      return { stripe: YELLOW_BORDER, bg: YELLOW_BG, text: YELLOW_TEXT };
    case "red":
      return { stripe: RED_TEXT, bg: RED_BG, text: RED_TEXT };
  }
}

function Section({
  title,
  items,
  tone,
}: {
  title: string;
  items: ClauseItem[];
  tone: "green" | "yellow" | "red";
}) {
  if (items.length === 0) return null;
  const t = toneStyle(tone);
  const [firstItem, ...rest] = items;

  return (
    // Outer view MUST allow wrapping — when a section has 10+ items they need
    // to flow across pages. Previously this was wrap={false} and react-pdf
    // collapsed the layout, causing card titles + bodies to overlap.
    <View>
      {/* Keep section header glued to the first item so the header never
          gets orphaned at the bottom of a page. */}
      <View wrap={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={[styles.sectionCount, { backgroundColor: t.bg, color: t.text }]}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </Text>
        </View>
        <ClauseCard item={firstItem} stripe={t.stripe} />
      </View>
      {rest.map((item, i) => (
        <ClauseCard key={i} item={item} stripe={t.stripe} />
      ))}
    </View>
  );
}

function ClauseCard({ item, stripe }: { item: ClauseItem; stripe: string }) {
  return (
    <View style={styles.clauseCard} wrap={false}>
      <View style={[styles.stripe, { backgroundColor: stripe }]} />
      <View style={styles.clauseBody}>
        <Text style={styles.clauseTitle}>{item.title}</Text>
        {item.explanation ? (
          <Text style={styles.clauseText}>{item.explanation}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function AnalysisPdf({
  analysis,
  filename,
  generatedFor,
}: {
  analysis: AnalysisResult;
  filename: string;
  generatedFor: string;
}) {
  const score = analysis.plain_english_score;
  const generatedAt = new Date().toISOString().slice(0, 10);

  return (
    <Document
      title={`KnowUrPolicy — ${filename}`}
      author="KnowUrPolicy"
      subject="Document analysis"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>
            Know<Text style={styles.brandAccent}>Ur</Text>Policy
          </Text>
          <Text style={styles.filename}>{filename}</Text>
          <Text style={styles.meta}>
            Analysis generated {generatedAt} · for {generatedFor}
          </Text>
        </View>

        <View style={styles.complexityRow}>
          <Text style={styles.complexityScore}>{score.score}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.complexityLabelLine}>
              Complexity: {score.label} ({score.score}/100)
            </Text>
            <Text style={styles.complexityNote}>{score.note}</Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>PLAIN ENGLISH SUMMARY</Text>
          <Text style={styles.summaryText}>{analysis.summary}</Text>
        </View>

        {/* Same order as on-screen results: positive baseline first, then risks. */}
        <Section title="What's covered" items={analysis.covered} tone="green" />
        <Section
          title="What's NOT covered"
          items={analysis.not_covered}
          tone="red"
        />
        <Section title="Watch list" items={analysis.watch_list} tone="red" />
        <Section
          title="Deadlines & limits"
          items={analysis.deadlines_and_limits}
          tone="yellow"
        />
        <Section
          title="Your obligations"
          items={analysis.your_obligations}
          tone="yellow"
        />

        <View style={styles.footer} fixed>
          <Text style={styles.disclaimer}>
            KnowUrPolicy helps you understand documents. This is not legal
            advice. For decisions with legal consequences, please consult a
            qualified attorney.
          </Text>
          <Text style={styles.footerMeta}>
            knowurpolicy.com · Generated {generatedAt}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
