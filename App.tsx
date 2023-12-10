import Recorder from "./components/Recorder";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SafeAreaView>
          <Recorder />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
