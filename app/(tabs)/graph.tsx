import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect} from 'expo-router';
import {collection, query, where, getDocs} from 'firebase/firestore';
import {db, auth} from '../../config/firebase';
import Svg, {Path, Circle, Text as SvgText} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Subscription = {
    id: string;
    name: string;
    amount: number;
    currency: string;
    intervalDays: number;
    color: string;
};

function PieChart({data, dark}: { data: { name: string; monthly: number; color: string }[]; dark: boolean }) {
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

        return {d, color: item.color};
    });

    const centerBg = dark ? '#1a1a1a' : '#f9f9f7';
    const textColor = dark ? '#fff' : '#111';

    return (
        <View style={{alignItems: 'center'}}>
            <Svg width={size} height={size}>
                {slices.map((slice, i) => (
                    <Path key={i} d={slice.d} fill={slice.color}/>
                ))}
                <Circle cx={cx} cy={cy} r={innerR - 2} fill={centerBg}/>
                <SvgText
                    x={cx}
                    y={cy - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#888"
                >
                    total / month
                </SvgText>
                <SvgText
                    x={cx}
                    y={cy + 16}
                    textAnchor="middle"
                    fontSize="19"
                    fontWeight="700"
                    fill={textColor}
                >
                    {total.toFixed(0)} CZK
                </SvgText>
            </Svg>
        </View>
    );
}

export default function GraphScreen() {
    const [darkMode, setDarkMode] = useState(false);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem('darkMode').then(val => {
                setDarkMode(val === 'true');
            });
        }, [])
    );

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
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        const uid = auth?.currentUser?.uid;
        if (uid) loadSubscriptions(uid);
        else setRefreshing(false);
    }, []);

    const chartData = subscriptions.map(s => ({
        name: s.name,
        monthly: (s.amount / s.intervalDays) * 30,
        color: s.color,
    }));

    const total = chartData.reduce((sum, d) => sum + d.monthly, 0);

    const d = darkMode;
    const bg = d ? '#111' : '#f9f9f7';
    const cardBg = d ? '#1a1a1a' : '#fff';
    const cardBorder = d ? '#2a2a2a' : '#e8e8e8';
    const tp = d ? '#fff' : '#111';
    const ts = d ? '#888' : '#888';
    const rowBorder = d ? '#2a2a2a' : '#f0f0f0';

    if (loading) {
        return (
            <View style={[styles.loadingContainer, {backgroundColor: bg}]}>
                <ActivityIndicator size="large" color={tp}/>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, {backgroundColor: bg}]}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tp} colors={[tp]}/>
            }
        >
            <Text style={[styles.title, {color: tp}]}>Spending overview</Text>
            <Text style={[styles.subtitle, {color: ts}]}>Monthly subscriptions</Text>

            {subscriptions.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={[styles.emptyIconBox, {backgroundColor: cardBg, borderColor: cardBorder}]}>
                        <Ionicons name="pie-chart-outline" size={36} color={ts}/>
                    </View>
                    <Text style={[styles.emptyTitle, {color: tp}]}>No data yet</Text>
                    <Text style={[styles.emptySubtitle, {color: ts}]}>Add subscriptions on the home screen</Text>
                </View>
            ) : (
                <>
                    <View style={[styles.card, {backgroundColor: cardBg, borderColor: cardBorder}]}>
                        <PieChart data={chartData} dark={darkMode}/>
                    </View>

                    <View style={[styles.legendCard, {backgroundColor: cardBg, borderColor: cardBorder}]}>
                        {chartData.map((item, i) => (
                            <View key={i} style={[styles.legendRow, {borderBottomColor: rowBorder}]}>
                                <View style={[styles.dot, {backgroundColor: item.color}]}/>
                                <Text style={[styles.legendName, {color: tp}]}>{item.name}</Text>
                                <Text style={[styles.legendAmount, {color: tp}]}>{item.monthly.toFixed(0)} CZK</Text>
                                <Text style={[styles.legendPercent, {color: ts}]}>
                                    {Math.round((item.monthly / total) * 100)}%
                                </Text>
                            </View>
                        ))}
                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, {color: tp}]}>Total</Text>
                            <Text style={[styles.totalAmount, {color: tp}]}>{total.toFixed(0)} CZK / month</Text>
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    content: {padding: 24, paddingTop: 60, paddingBottom: 40},
    title: {fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4},
    subtitle: {fontSize: 15, marginBottom: 24},
    card: {borderRadius: 20, borderWidth: 1.5, padding: 20, alignItems: 'center', marginBottom: 16},
    legendCard: {borderRadius: 20, borderWidth: 1.5, padding: 20, marginBottom: 32},
    legendRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1},
    dot: {width: 12, height: 12, borderRadius: 6, marginRight: 12},
    legendName: {flex: 1, fontSize: 15, fontWeight: '500'},
    legendAmount: {fontSize: 15, fontWeight: '600', marginRight: 12},
    legendPercent: {fontSize: 13, width: 36, textAlign: 'right'},
    totalRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14},
    totalLabel: {fontSize: 16, fontWeight: '700'},
    totalAmount: {fontSize: 16, fontWeight: '700'},
    emptyState: {alignItems: 'center', paddingVertical: 60},
    emptyIconBox: {
        width: 72,
        height: 72,
        borderRadius: 20,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    emptyTitle: {fontSize: 20, fontWeight: '600', marginBottom: 8},
    emptySubtitle: {fontSize: 15, textAlign: 'center'},
});