import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { atlasTopics, curriculumTopics, loadChunks, loadDocuments, searchChunks, topicHasCoverage } from './src/data';
import { isSupabaseConfigured } from './src/supabase';
import { DocumentRecord, SourceChunk, Topic } from './src/types';

type Tab = 'study' | 'sources' | 'search';

export default function App() {
  const studyScrollRef = useRef<ScrollView>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [chunks, setChunks] = useState<SourceChunk[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedChunks, setSelectedChunks] = useState<SourceChunk[]>([]);
  const [tab, setTab] = useState<Tab>('study');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env.local.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [nextDocuments, nextChunks] = await Promise.all([loadDocuments(), loadChunks()]);
      setDocuments(nextDocuments);
      setChunks(nextChunks);
    } catch (err) {
      console.error(err);
      setError('Could not load Supabase source documents.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sourceCountByDocument = useMemo(() => {
    const counts = new Map<string, number>();
    chunks.forEach((chunk) => counts.set(chunk.document_id, (counts.get(chunk.document_id) ?? 0) + 1));
    return counts;
  }, [chunks]);

  const openTopic = async (topic: Topic) => {
    setSelectedTopic(topic);
    setSelectedChunks([]);
    setTab('study');
    setIsLoading(true);
    setError(null);
    setTimeout(() => studyScrollRef.current?.scrollToEnd({ animated: true }), 80);
    try {
      const resultsById = new Map<string, SourceChunk>();
      for (const term of topic.terms) {
        const results = await searchChunks(term, 6);
        results.forEach((chunk) => resultsById.set(chunk.id, chunk));
        if (resultsById.size >= 12) break;
      }
      setSelectedChunks(Array.from(resultsById.values()).slice(0, 12));
    } catch (err) {
      console.error(err);
      setError(`Could not load source notes for ${topic.title}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const runSearch = async () => {
    setSelectedTopic({ title: `Search: ${query}`, terms: [query] });
    setSelectedChunks([]);
    setIsLoading(true);
    setError(null);
    try {
      setSelectedChunks(await searchChunks(query, 25));
      setTab('study');
      setTimeout(() => studyScrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (err) {
      console.error(err);
      setError('Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>PIERCER'S PRO-STUDY</Text>
        <Text style={styles.subtitle}>Source-backed piercing study notes</Text>
      </View>

      <View style={styles.tabs}>
        <TabButton label="Study" active={tab === 'study'} onPress={() => setTab('study')} />
        <TabButton label="Sources" active={tab === 'sources'} onPress={() => setTab('sources')} />
        <TabButton label="Search" active={tab === 'search'} onPress={() => setTab('search')} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {tab === 'study' && (
        <ScrollView ref={studyScrollRef} contentContainerStyle={styles.content}>
          <View style={styles.statsRow}>
            <Stat label="Sources" value={documents.length} />
            <Stat label="Pages" value={chunks.length} />
          </View>

          <Text style={styles.sectionTitle}>Curriculum</Text>
          {curriculumTopics.map((topic) => (
            <TopicCard
              key={topic.title}
              topic={topic}
              hasCoverage={topicHasCoverage(topic, documents, chunks)}
              isSelected={selectedTopic?.title === topic.title}
              onPress={() => openTopic(topic)}
            />
          ))}

          <Text style={styles.sectionTitle}>Technical Atlas</Text>
          {atlasTopics.map((topic) => (
            <TopicCard
              key={topic.title}
              topic={topic}
              hasCoverage={topicHasCoverage(topic, documents, chunks)}
              isSelected={selectedTopic?.title === topic.title}
              onPress={() => openTopic(topic)}
            />
          ))}

          <View style={styles.sourcePanel}>
            <Text style={styles.panelEyebrow}>Source Notes</Text>
            <Text style={styles.panelTitle}>{selectedTopic?.title ?? 'Open a topic'}</Text>
            {selectedTopic && !isLoading && selectedChunks.length > 0 && (
              <Text style={styles.panelMeta}>{selectedChunks.length} matching source pages found.</Text>
            )}
            {isLoading && selectedTopic ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#000" />
                <Text style={styles.loadingText}>Loading source notes for {selectedTopic.title}...</Text>
              </View>
            ) : !selectedTopic ? (
              <Text style={styles.empty}>Tap a topic above to load matching source notes from your PDFs.</Text>
            ) : selectedChunks.length === 0 ? (
              <Text style={styles.empty}>No matching source notes yet. Add more PDFs for this topic.</Text>
            ) : (
              selectedChunks.map((chunk) => <ChunkCard key={chunk.id} chunk={chunk} documents={documents} />)
            )}
          </View>
        </ScrollView>
      )}

      {tab === 'sources' && (
        <FlatList
          contentContainerStyle={styles.content}
          data={documents}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={refresh}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>{item.filename}</Text>
              <Text style={styles.badge}>{sourceCountByDocument.get(item.id) ?? 0} pages extracted</Text>
              <Text style={styles.meta}>{(item.topic_tags ?? []).join(' / ')}</Text>
            </View>
          )}
        />
      )}

      {tab === 'search' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Search Sources</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Try skin, aftercare, anatomy, genital..."
            placeholderTextColor="#777"
            style={styles.input}
          />
          <Pressable style={styles.primaryButton} onPress={runSearch}>
            <Text style={styles.primaryButtonText}>Search</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TopicCard({
  topic,
  hasCoverage,
  isSelected,
  onPress,
}: {
  topic: Topic;
  hasCoverage: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      android_ripple={{ color: '#ffb36b' }}
      style={({ pressed }) => [styles.topicCard, isSelected && styles.topicCardSelected, pressed && styles.topicCardPressed]}
      onPress={onPress}
    >
      <View style={[styles.dot, hasCoverage ? styles.dotOn : styles.dotOff]} />
      <Text style={[styles.topicTitle, isSelected && styles.topicTitleSelected]}>{topic.title}</Text>
      <Text style={[styles.topicStatus, isSelected && styles.topicStatusSelected]}>
        {isSelected ? 'Selected' : hasCoverage ? 'Has source data' : 'Gap'}
      </Text>
    </Pressable>
  );
}

function ChunkCard({ chunk, documents }: { chunk: SourceChunk; documents: DocumentRecord[] }) {
  const document = documents.find((item) => item.id === chunk.document_id);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{chunk.heading ?? chunk.topic_title ?? document?.title ?? 'Source page'}</Text>
      <Text style={styles.meta}>
        {document?.title ?? 'Source document'}
        {chunk.page_number ? `, page ${chunk.page_number}` : ''}
      </Text>
      <Text style={styles.body}>{chunk.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ff6b00',
  },
  header: {
    backgroundColor: '#050505',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  logo: {
    color: '#ff6b00',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  tab: {
    borderColor: '#000',
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabText: {
    fontWeight: '900',
    color: '#000',
  },
  tabTextActive: {
    color: '#ff6b00',
  },
  content: {
    padding: 14,
    paddingBottom: 42,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  stat: {
    flex: 1,
    borderColor: '#000',
    borderWidth: 3,
    backgroundColor: '#fff',
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#555',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 10,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderColor: '#000',
    borderWidth: 3,
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 10,
  },
  topicCardSelected: {
    backgroundColor: '#000',
    borderColor: '#fff',
  },
  topicCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOn: {
    backgroundColor: '#16a34a',
  },
  dotOff: {
    backgroundColor: '#d4d4d8',
  },
  topicTitle: {
    flex: 1,
    fontWeight: '900',
    fontSize: 15,
    textTransform: 'uppercase',
  },
  topicTitleSelected: {
    color: '#ff6b00',
  },
  topicStatus: {
    fontSize: 10,
    fontWeight: '900',
    color: '#555',
    textTransform: 'uppercase',
  },
  topicStatusSelected: {
    color: '#fff',
  },
  sourcePanel: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 4,
    padding: 14,
    marginTop: 18,
  },
  panelEyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff6b00',
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  panelTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  panelMeta: {
    color: '#555',
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  loadingRow: {
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 3,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    padding: 14,
  },
  loadingText: {
    flex: 1,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 3,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  meta: {
    color: '#555',
    fontWeight: '700',
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#000',
    color: '#ff6b00',
    fontWeight: '900',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  body: {
    marginTop: 10,
    lineHeight: 20,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 3,
    padding: 14,
    fontWeight: '800',
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#000',
    borderColor: '#000',
    borderWidth: 3,
    padding: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ff6b00',
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  error: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderColor: '#000',
    borderWidth: 2,
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: 10,
    fontWeight: '800',
  },
  empty: {
    fontWeight: '800',
    color: '#333',
  },
});
