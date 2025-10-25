import { useSignUp } from "@clerk/clerk-expo";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

    setIsLoading(true);

    try {
      // Create a sign-up attempt with the provided details
      const signUpAttempt = await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      });

      // Send the email verification
      await signUpAttempt.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      // In a real app, we'd go to a verification screen
      // For the demo, we'll just sign them in directly
      
      // Complete sign-up
      const signInAttempt = await signUpAttempt.attemptEmailAddressVerification({
        code: "000000", // Since this is a demo, we're skipping verification
      });
      
      // Set the active session (signs the user in)
      await setActive({ session: signInAttempt.createdSessionId });

      // Redirect to home
      router.replace("/");
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error signing up", err.errors?.[0]?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignIn = () => {
    router.push("/sign-in");
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
      <Text style={styles.title}>Create Account</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />
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
        onPress={onSignUpPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text>Already have an account? </Text>
        <TouchableOpacity onPress={navigateToSignIn}>
          <Text style={styles.link}>Sign In</Text>
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