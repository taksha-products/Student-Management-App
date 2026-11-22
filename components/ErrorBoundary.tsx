import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Shows a recoverable screen instead of a blank native crash for JS errors. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{this.state.error.message}</Text>
        <Pressable
          style={styles.btn}
          onPress={() => this.setState({ error: null })}
        >
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#FFF7ED"
  },
  title: { fontSize: 22, fontWeight: "800", color: "#171717", marginBottom: 8 },
  message: { fontSize: 14, color: "#737373", marginBottom: 20 },
  btn: {
    alignSelf: "flex-start",
    backgroundColor: "#F97316",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12
  },
  btnText: { color: "#fff", fontWeight: "700" }
});
