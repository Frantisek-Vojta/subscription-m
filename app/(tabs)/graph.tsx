import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, ActivityIndicator} from 'react-native';
import {collection, query, where, getDocs} from 'firebase/firestore';
import {db, auth} from '../../config/firebase';
import Svg, {Path, Circle, Text as SvgText} from 'react-native-svg';

type Subscription = {
    id: string;
    name: string;
    amount: number;
    currency: string;
    intervalDays: number;
    color: string;
};

function PieChart({data}: { data: { name: string; monthly: number; color: string }[] }) {
    const total = data.reduce((sum, d) => sum + d.monthly, 0);
    if (total === 0) return null;

    const size = 260;
    const cx = size / 2;
    const cy = size / 2;
    const r = 100;
    const innerR = 58;
    let currentAngle = -Math.PI / 2;

    const slices = data.map((item) => {
        const angle = (item.monthly / total) * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + innerR * Math.cos(startAngle);
        const iy1 = cy + innerR * Math.sin(startAngle);
        const ix2 = cx + innerR * Math.cos(endAngle);
        const iy2 = cy + innerR * Math.sin(endAngle);
        const largeArc = angle > Math.PI ? 1 : 0;

        const d = [
            `M ${x1} ${y1}`,
            `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
            `L ${ix2} ${iy2}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
            'Z',
        ].join(' ');

        return {d, color: item.color, name: item.name, monthly: item.monthly};
    });

    return (
        <View style={{alignItems: 'center'}}>
            <Svg width={size} height={size}>
                {slices.map((slice, i) => (
                    <Path key={i} d={slice.d} fill={slice.color}/>
                ))}
                <Circle cx={cx} cy={cy} r={innerR - 2} fill="#f9f9f7"/>
                <SvgText x={cx} y={cy - 10} textAnchor="middle" fontSize="12" fill="#888">
                    total / month
                </SvgText>
                <SvgText x={cx} y={cy + 14} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111">
                    {total.toFixed(0)} CZK
                </SvgText>
            </Svg>
        </View>
    );
}

export default function GraphScreen() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth?.onAuthStateChanged((user) => {
            if (user) loadSubscriptions(user.uid);
            else setLoading(false);
        });
        return () => unsubscribe?.();
    }, []);

    const loadSubscriptions = async (uid: string) => {
        try {
            if (!db) {
                setLoading(false);
                return;
            }
            const q = query(collection(db, 'subscriptions'), where('userId', '==', uid));
            const snapshot = await getDocs(q);
            const subs = snapshot.docs.map(d => ({id: d.id, ...d.data()})) as Subscription[];
            setSubscriptions(subs);
        } catch (error) {
            console.log('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = subscriptions.map(s => ({
        name: s.name,
        monthly: (s.amount / s.intervalDays) * 30,
        color: s.color,
    }));

    const total = chartData.reduce((sum, d) => sum + d.monthly, 0);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#111"/>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Spending overview</Text>
            <Text style={styles.subtitle}>Monthly subscriptions</Text>

            {subscriptions.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconBox}>
                        <Text style={styles.emptyIcon}>📊</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No data yet</Text>
                    <Text style={styles.emptySubtitle}>Add subscriptions on the home screen</Text>
                </View>
            ) : (
                <>
                    <View style={styles.card}>
                        <PieChart data={chartData}/>
                    </View>

                    <View style={styles.legendCard}>
                        {chartData.map((item, i) => (
                            <View key={i} style={styles.legendRow}>
                                <View style={[styles.dot, {backgroundColor: item.color}]}/>
                                <Text style={styles.legendName}>{item.name}</Text>
                                <Text style={styles.legendAmount}>{item.monthly.toFixed(0)} CZK</Text>
                                <Text style={styles.legendPercent}>
                                    {Math.round((item.monthly / total) * 100)}%
                                </Text>
                            </View>
                        ))}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>{total.toFixed(0)} CZK / month</Text>
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f9f9f7'},
    loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f7'},
    content: {padding: 24, paddingTop: 60, paddingBottom: 40},
    title: {fontSize: 28, fontWeight: '700', color: '#111', letterSpacing: -0.5, marginBottom: 4},
    subtitle: {fontSize: 15, color: '#888', marginBottom: 24},
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e8e8e8',
        padding: 20,
        alignItems: 'center',
        marginBottom: 16
    },
    legendCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e8e8e8',
        padding: 20,
        marginBottom: 32
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    dot: {width: 12, height: 12, borderRadius: 6, marginRight: 12},
    legendName: {flex: 1, fontSize: 15, color: '#111', fontWeight: '500'},
    legendAmount: {fontSize: 15, color: '#111', fontWeight: '600', marginRight: 12},
    legendPercent: {fontSize: 13, color: '#888', width: 36, textAlign: 'right'},
    totalRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14},
    totalLabel: {fontSize: 16, fontWeight: '700', color: '#111'},
    totalAmount: {fontSize: 16, fontWeight: '700', color: '#111'},
    emptyState: {alignItems: 'center', paddingVertical: 60},
    emptyIconBox: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e8e8e8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    emptyIcon: {fontSize: 32},
    emptyTitle: {fontSize: 20, fontWeight: '600', color: '#111', marginBottom: 8},
    emptySubtitle: {fontSize: 15, color: '#888', textAlign: 'center'},
});