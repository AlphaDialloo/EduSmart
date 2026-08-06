import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../src/contexts/AuthContext";
import { getInstructorPaymentAnalytics } from "../../src/services/instructor.service";

function money(value, currency = "CAD") {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

function SummaryCard({ label, value }) {
  return (
    <View
      style={{
        width: "48%",
        minHeight: 110,
        borderRadius: 20,
        backgroundColor: "#fff",
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          marginTop: 7,
          color: "#64748b",
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function InstructorSalesPage() {
  const { token } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      if (!token) {
        return;
      }

      try {
        refresh ? setRefreshing(true) : setLoading(true);
        setError("");

        const data =
          await getInstructorPaymentAnalytics(
            token,
            6,
          );

        setAnalytics(data);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Impossible de charger les ventes.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    load();
  }, [load]);

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
        <ActivityIndicator
          size="large"
          color="#4f46e5"
        />
      </View>
    );
  }

  const summary = analytics?.summary || {};
  const monthly =
    analytics?.monthlySales ||
    analytics?.monthlyRevenue ||
    [];
  const sales =
    analytics?.recentSales ||
    analytics?.recentPayments ||
    [];

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load({ refresh: true })}
        />
      }
      contentContainerStyle={{
        padding: 19,
        paddingTop: 54,
        paddingBottom: 95,
        backgroundColor: "#f8fafc",
      }}
    >
      <Text
        style={{
          fontSize: 30,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        Ventes et revenus
      </Text>

      <Text
        style={{
          marginTop: 7,
          color: "#64748b",
        }}
      >
        Résumé de vos ventes de cours.
      </Text>

      {error ? (
        <View
          style={{
            marginTop: 16,
            borderRadius: 14,
            backgroundColor: "#fee2e2",
            padding: 13,
          }}
        >
          <Text
            style={{
              color: "#b91c1c",
              fontWeight: "800",
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          marginTop: 22,
          borderRadius: 22,
          padding: 21,
          backgroundColor: "#4f46e5",
        }}
      >
        <Text
          style={{
            color: "#c7d2fe",
            fontWeight: "800",
          }}
        >
          Votre revenu net
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: "#fff",
            fontSize: 32,
            fontWeight: "900",
          }}
        >
          {money(summary.instructorRevenue)}
        </Text>

        <Text
          style={{
            marginTop: 7,
            color: "#c7d2fe",
          }}
        >
          Chiffre d’affaires brut :{" "}
          {money(summary.grossRevenue)}
        </Text>
      </View>

      <View
        style={{
          marginTop: 15,
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <SummaryCard
          label="Ventes"
          value={summary.salesCount || 0}
        />

        <SummaryCard
          label="Ventes ce mois"
          value={summary.currentMonthSales || 0}
        />

        <SummaryCard
          label="Revenu brut du mois"
          value={money(
            summary.currentMonthGrossRevenue,
          )}
        />

        <SummaryCard
          label="Commission plateforme"
          value={money(
            summary.platformCommission,
          )}
        />
      </View>

      <Text
        style={{
          marginTop: 27,
          fontSize: 22,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        Évolution mensuelle
      </Text>

      <View
        style={{
          marginTop: 13,
          borderRadius: 20,
          backgroundColor: "#fff",
          padding: 16,
          borderWidth: 1,
          borderColor: "#e2e8f0",
        }}
      >
        {monthly.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Aucune donnée mensuelle.
          </Text>
        ) : (
          monthly.map((item) => {
            const maxRevenue = Math.max(
              ...monthly.map((entry) =>
                Number(
                  entry.instructorRevenue ||
                    entry.revenue ||
                    0,
                ),
              ),
              1,
            );

            const revenue = Number(
              item.instructorRevenue ||
                item.revenue ||
                0,
            );

            return (
              <View
                key={item.month}
                style={{ marginBottom: 14 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: "#475569",
                      fontWeight: "800",
                    }}
                  >
                    {item.label || item.month}
                  </Text>

                  <Text
                    style={{
                      color: "#0f172a",
                      fontWeight: "900",
                    }}
                  >
                    {money(revenue)}
                  </Text>
                </View>

                <View
                  style={{
                    marginTop: 7,
                    height: 9,
                    overflow: "hidden",
                    borderRadius: 999,
                    backgroundColor: "#e2e8f0",
                  }}
                >
                  <View
                    style={{
                      width: `${Math.max(
                        3,
                        (revenue / maxRevenue) * 100,
                      )}%`,
                      height: "100%",
                      borderRadius: 999,
                      backgroundColor: "#4f46e5",
                    }}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      <Text
        style={{
          marginTop: 27,
          fontSize: 22,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        Dernières ventes
      </Text>

      {sales.length === 0 ? (
        <View
          style={{
            marginTop: 13,
            borderRadius: 20,
            backgroundColor: "#fff",
            padding: 22,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Aucune vente récente.
          </Text>
        </View>
      ) : (
        sales.map((sale) => (
          <View
            key={sale.id}
            style={{
              marginTop: 11,
              borderRadius: 18,
              backgroundColor: "#fff",
              padding: 15,
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text
              style={{
                fontWeight: "900",
                color: "#0f172a",
              }}
            >
              {sale.courseTitle || "Cours EduSmart"}
            </Text>

            <View
              style={{
                marginTop: 7,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: "#64748b",
                }}
              >
                {sale.planType || "Plan"}
              </Text>

              <Text
                style={{
                  color: "#15803d",
                  fontWeight: "900",
                }}
              >
                {money(
                  sale.instructorRevenue ||
                    sale.amount,
                  sale.currency || "CAD",
                )}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
