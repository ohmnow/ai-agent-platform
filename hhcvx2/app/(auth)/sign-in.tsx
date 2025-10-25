import { useSignIn } from "@clerk/clerk-expo";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

export default function SignInScreen() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }

    setIsLoading(true);

    try {
      // Create a sign-in attempt with the email and password
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // Set the active session (signs the user in)
      await setActive({ session: signInAttempt.createdSessionId });

      // Redirect to home or dashboard based on role
      router.replace("/");
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error signing in", err.errors?.[0]?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignUp = () => {
    router.push("/sign-up");
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Sign In</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={emailAddress}
          onChangeText={setEmailAddress}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      <TouchableOpacity 
        style={styles.button}
        onPress={onSignInPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity onPress={navigateToSignUp}>
          <Text style={styles.link}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  link: {
    color: "#007bff",
    fontWeight: "bold",
  },
}); 