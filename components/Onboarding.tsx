import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const ONBOARDING_DATA = [
  {
    id: "1",
    title: "Track your bus",
    highlight: "in real-time",
    description:
      "See live locations of all buses on your route and get accurate arrival times instantly.",
    // Using a high-quality placeholder URL
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Plan your trip",
    highlight: "with ease",
    description:
      "Find the best routes and schedules to reach your destination faster.",
    image:
      "https://images.unsplash.com/photo-1556122071-e404be747385?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Smart Notifications",
    highlight: "stay updated",
    description:
      "Get alerts for delays, arrivals, and route changes directly on your phone.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=500&auto=format&fit=crop",
  },
];

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const scrollToNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onFinish();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={onFinish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        data={ONBOARDING_DATA}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        ref={slidesRef}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Image Section */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.image }}
                style={styles.imageCard}
                resizeMode="cover"
              />
              {/* Floating Overlay Card */}
              <View style={styles.overlayCard}>
                <View style={styles.busIconContainer}>
                  <Text style={{ fontSize: 20 }}>🚍</Text>
                </View>
                <View style={styles.skeletonText}>
                  <View style={styles.line} />
                  <View style={[styles.line, { width: "40%", marginTop: 8 }]} />
                </View>
                <View style={styles.onTimeBadge}>
                  <Text style={styles.onTimeText}>OnTime</Text>
                </View>
              </View>
            </View>

            {/* Text Section */}
            <View style={styles.textSection}>
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.highlightText}>{item.highlight}</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      {/* Pagination & Footer */}
      <View style={styles.footer}>
        <View style={styles.paginationRow}>
          {ONBOARDING_DATA.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === currentIndex ? 24 : 8,
                  opacity: i === currentIndex ? 1 : 0.3,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={scrollToNext}>
          <Text style={styles.primaryBtnText}>
            {currentIndex === ONBOARDING_DATA.length - 1
              ? "Get Started"
              : "Next →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1223" },
  skipBtn: { position: "absolute", top: 50, right: 25, zIndex: 10 },
  skipText: { color: "#8E8E93", fontSize: 16, fontWeight: "500" },
  slide: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  imageContainer: {
    width: width * 0.88,
    height: height * 0.42,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#1C2538", // Fallback color
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  imageCard: { width: "100%", height: "100%" },
  overlayCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  busIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#318CE7",
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonText: { flex: 1, marginLeft: 15 },
  line: {
    height: 6,
    backgroundColor: "#FFF",
    borderRadius: 3,
    opacity: 0.8,
    width: "60%",
  },
  onTimeBadge: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  onTimeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  textSection: { alignItems: "center", paddingHorizontal: 40, marginTop: 40 },
  titleText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  highlightText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#318CE7",
    textAlign: "center",
  },
  descriptionText: {
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 15,
    fontSize: 16,
    lineHeight: 24,
  },
  footer: { position: "absolute", bottom: 50, width: "100%" },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#318CE7",
    marginHorizontal: 4,
  },
  primaryBtn: {
    backgroundColor: "#318CE7",
    marginHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
