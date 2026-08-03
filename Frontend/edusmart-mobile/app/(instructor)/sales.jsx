import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useAuth } from "../../src/contexts/AuthContext";
import { getInstructorPaymentAnalytics } from "../../src/services/instructor.service";

function money(value) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(Number(value || 0));
}

export default function InstructorSalesPage() {
  const { token } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getInstructorPaymentAnalytics(token, 6);
        setAnalytics(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingTop: 56,
        backgroundColor: "#f8fafc",
        minHeight: "100%",
      }}
    >
      <Text style={{ fontSize: 30, fontWeight: "900", color: "#0f172a" }}>
        Revenus et ventes
      </Text>

      <View
        style={{
          marginTop: 22,
          borderRadius: 22,
          padding: 22,
          backgroundColor: "#4f46e5",
        }}
      >
        <Text style={{ color: "#c7d2fe", fontWeight: "800" }}>
          Revenus formateur
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: "#fff",
            fontSize: 32,
            fontWeight: "900",
          }}
        >
          {money(analytics?.summary?.instructorRevenue)}
        </Text>
      </View>
    </ScrollView>
  );
}
