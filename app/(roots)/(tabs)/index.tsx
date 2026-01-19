import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
   
      <Link href="/sign-in">Sign In</Link>
      <Link href="/map">Map</Link>
      <Link href="/profile">Profile</Link>
      <Link href="/walks/1">Walks</Link>

    </View>
  );
}
