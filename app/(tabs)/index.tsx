import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';

const CURRENCIES = ['CZK', 'EUR', 'USD', 'GBP'];

const BILLING_PRESETS = [
    { label: 'Týdně', value: 7 },
    { label: '2 týdny', value: 14 },
    { label: 'Měsíčně', value: 30 },
    { label: 'Ročně', value: 365 },
];

const SUB_COLORS = [
    '#6366f1', '#f59e0b', '#10b981', '#3b82f6',
    '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6',
];

const MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];

type Subscription = {
    id: string;
    name: string;
    amount: number;
    currency: string;
    intervalDays: number;
    customInterval: boolean;
    startDate: string;
    nextBilling: string;
    hasTrial: boolean;
    trialDays: number;
    color: string;
};

function daysToLabel(days: number): string {
    if (days === 7) return 'Týdně';
    if (days === 14) return 'Každé 2 týdny';
    if (days === 30) return 'Měsíčně';
    if (days === 365) return 'Ročně';
    return `Každých ${days} dní`;
}

function daysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = dateStr.split('.');
    if (parts.length !== 3) return 0;
    const target = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatDateFromParts(day: number, month: number, year: number): string {
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
}

function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
}

function calcNextBilling(startDateStr: string, intervalDays: number): string {
    const parts = startDateStr.split('.');
    if (parts.length !== 3) return startDateStr;
    const start = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (start >= today) return startDateStr;
    let next = new Date(start);
    while (next <= today) {
        next.setDate(next.getDate() + intervalDays);
    }
    return formatDate(next);
}

function DatePickerInline({ onClose, onSelect }: {
    onClose: () => void;
    onSelect: (date: string) => void;
}) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
    const [selected, setSelected] = useState<{ day: number; month: number; year: number } | null>(null);

    const daysInMonth = getDaysInMonth(viewMonth, viewYear);
    const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const prevMonth = () => {
        if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const handleConfirm = () => {
        if (!selected) return;
        onSelect(formatDateFromParts(selected.day, selected.month, selected.year));
        onClose();
    };

    const isSelected = (day: number) =>
        selected?.day === day && selected?.month === viewMonth && selected?.year === viewYear;

    const isToday = (day: number) =>
        today.getDate() === day && today.getMonth() + 1 === viewMonth && today.getFullYear() === viewYear;

    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);

    return (
        <View style={dpStyles.container}>
            <View style={dpStyles.header}>
                <TouchableOpacity onPress={prevMonth} style={dpStyles.navBtn}>
                    <Ionicons name="chevron-back" size={20} color="#111" />
                </TouchableOpacity>
                <Text style={dpStyles.monthLabel}>{MONTHS[viewMonth - 1]} {viewYear}</Text>
                <TouchableOpacity onPress={nextMonth} style={dpStyles.navBtn}>
                    <Ionicons name="chevron-forward" size={20} color="#111" />
                </TouchableOpacity>
            </View>

            <View style={dpStyles.weekRow}>
                {['Po','Út','St','Čt','Pá','So','Ne'].map(d => (
                    <Text key={d} style={dpStyles.weekDay}>{d}</Text>
                ))}
            </View>

            <View style={dpStyles.grid}>
                {cells.map((day, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[
                            dpStyles.cell,
                            day !== null && isSelected(day) && dpStyles.cellSelected,
                            day !== null && isToday(day) && !isSelected(day) && dpStyles.cellToday,
                        ]}
                        onPress={() => day !== null && setSelected({ day, month: viewMonth, year: viewYear })}
                        disabled={day === null}
                        activeOpacity={0.7}
                    >
                        {day !== null && (
                            <Text style={[
                                dpStyles.cellText,
                                isSelected(day) && dpStyles.cellTextSelected,
                                isToday(day) && !isSelected(day) && dpStyles.cellTextToday,
                            ]}>
                                {day}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={dpStyles.footer}>
                <TouchableOpacity style={dpStyles.cancelBtn} onPress={onClose}>
                    <Text style={dpStyles.cancelText}>Zrušit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[dpStyles.confirmBtn, !selected && dpStyles.confirmBtnDisabled]}
                    onPress={handleConfirm}
                    disabled={!selected}
                >
                    <Text style={dpStyles.confirmText}>Potvrdit</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function HomeScreen() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('CZK');
    const [intervalDays, setIntervalDays] = useState(30);
    const [customInterval, setCustomInterval] = useState(false);
    const [customDays, setCustomDays] = useState('');
    const [startDate, setStartDate] = useState(formatDate(new Date()));
    const [hasTrial, setHasTrial] = useState(false);
    const [trialDays, setTrialDays] = useState('7');

    const [nameFocused, setNameFocused] = useState(false);
    const [amountFocused, setAmountFocused] = useState(false);
    const [customDaysFocused, setCustomDaysFocused] = useState(false);
    const [trialDaysFocused, setTrialDaysFocused] = useState(false);

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        try {
            const uid = auth?.currentUser?.uid;
            if (!uid || !db) { setLoading(false); return; }
            const q = query(collection(db, 'subscriptions'), where('userId', '==', uid));
            const snapshot = await getDocs(q);
            const subs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Subscription[];
            setSubscriptions(subs);
        } catch (error) {
            console.log('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!name.trim()) { Alert.alert('Chyba', 'Zadej název předplatného'); return; }
        if (!amount || isNaN(Number(amount))) { Alert.alert('Chyba', 'Zadej platnou částku'); return; }
        if (!startDate.trim()) { Alert.alert('Chyba', 'Vyber datum začátku'); return; }

        const finalDays = customInterval ? Number(customDays) : intervalDays;
        if (customInterval && (!customDays || isNaN(finalDays) || finalDays < 1)) {
            Alert.alert('Chyba', 'Zadej platný počet dní');
            return;
        }

        const uid = auth?.currentUser?.uid;
        if (!uid) { Alert.alert('Chyba', 'Nejsi přihlášen'); return; }
        if (!db) { Alert.alert('Chyba', 'Databáze není dostupná'); return; }

        setSaving(true);
        try {
            const nextBilling = calcNextBilling(startDate, finalDays);
            const color = SUB_COLORS[subscriptions.length % SUB_COLORS.length];
            const newSub = {
                userId: uid,
                name: name.trim(),
                amount: Number(amount),
                currency,
                intervalDays: finalDays,
                customInterval,
                startDate,
                nextBilling,
                hasTrial,
                trialDays: hasTrial ? Number(trialDays) : 0,
                color,
                createdAt: new Date().toISOString(),
            };
            const docRef = await addDoc(collection(db, 'subscriptions'), newSub);
            setSubscriptions(prev => [...prev, { id: docRef.id, ...newSub }]);
            resetForm();
            setModalVisible(false);
        } catch (error: any) {
            console.log('Save error:', error);
            Alert.alert('Chyba', 'Nepodařilo se uložit: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Smazat', 'Opravdu chceš smazat toto předplatné?', [
            { text: 'Zrušit', style: 'cancel' },
            {
                text: 'Smazat', style: 'destructive', onPress: async () => {
                    try {
                        if (!db) return;
                        await deleteDoc(doc(db, 'subscriptions', id));
                        setSubscriptions(prev => prev.filter(s => s.id !== id));
                    } catch {
                        Alert.alert('Chyba', 'Nepodařilo se smazat předplatné');
                    }
                }
            },
        ]);
    };

    const resetForm = () => {
        setName('');
        setAmount('');
        setCurrency('CZK');
        setIntervalDays(30);
        setCustomInterval(false);
        setCustomDays('');
        setStartDate(formatDate(new Date()));
        setHasTrial(false);
        setTrialDays('7');
        setDatePickerVisible(false);
    };

    const totalMonthly = subscriptions.reduce((sum, s) => {
        return sum + (s.amount / s.intervalDays) * 30;
    }, 0);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#111" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Předplatná</Text>
                        <Text style={styles.subtitle}>Správa výdajů</Text>
                    </View>
                </View>

                {subscriptions.length > 0 && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Měsíční výdaje (odhad)</Text>
                        <Text style={styles.summaryAmount}>{totalMonthly.toFixed(0)} CZK</Text>
                        <Text style={styles.summaryCount}>{subscriptions.length} předplatných</Text>
                    </View>
                )}

                {subscriptions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="card-outline" size={36} color="#ccc" />
                        </View>
                        <Text style={styles.emptyTitle}>Žádná předplatná</Text>
                        <Text style={styles.emptySubtitle}>Přidej první předplatné pomocí tlačítka +</Text>
                    </View>
                ) : (
                    subscriptions.map((sub) => {
                        const days = daysUntil(sub.nextBilling);
                        const isTrialActive = sub.hasTrial && days > 0 && days <= sub.trialDays;
                        return (
                            <TouchableOpacity
                                key={sub.id}
                                style={styles.subCard}
                                onLongPress={() => handleDelete(sub.id)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.subColorBar, { backgroundColor: sub.color }]} />
                                <View style={styles.subInfo}>
                                    <View style={styles.subNameRow}>
                                        <Text style={styles.subName}>{sub.name}</Text>
                                        {isTrialActive && (
                                            <View style={styles.trialBadge}>
                                                <Text style={styles.trialBadgeText}>Trial</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.subCycle}>{daysToLabel(sub.intervalDays)}</Text>
                                    <Text style={styles.subNext}>
                                        {days < 0
                                            ? 'Vyúčtování proběhlo'
                                            : days === 0
                                                ? 'Platba dnes'
                                                : `Příští platba za ${days} ${days === 1 ? 'den' : days < 5 ? 'dny' : 'dní'}`}
                                    </Text>
                                </View>
                                <View style={styles.subAmountContainer}>
                                    <Text style={styles.subAmount}>{sub.amount}</Text>
                                    <Text style={styles.subCurrency}>{sub.currency}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}

                {subscriptions.length > 0 && (
                    <Text style={styles.hint}>Přidržením prstu předplatné smažeš</Text>
                )}
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>

                    {datePickerVisible && (
                        <View style={styles.datePickerOverlay}>
                            <DatePickerInline
                                onClose={() => setDatePickerVisible(false)}
                                onSelect={(date) => { setStartDate(date); setDatePickerVisible(false); }}
                            />
                        </View>
                    )}

                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nové předplatné</Text>
                            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                                <Ionicons name="close" size={24} color="#888" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                            <Text style={styles.fieldLabel}>Název</Text>
                            <View style={[styles.inputWrapper, nameFocused && styles.inputFocused]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Netflix, Spotify..."
                                    placeholderTextColor="#aaa"
                                    value={name}
                                    onChangeText={setName}
                                    onFocus={() => setNameFocused(true)}
                                    onBlur={() => setNameFocused(false)}
                                />
                            </View>

                            <Text style={styles.fieldLabel}>Částka</Text>
                            <View style={styles.amountRow}>
                                <View style={[styles.inputWrapper, styles.amountInput, amountFocused && styles.inputFocused]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0"
                                        placeholderTextColor="#aaa"
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                        onFocus={() => setAmountFocused(true)}
                                        onBlur={() => setAmountFocused(false)}
                                    />
                                </View>
                                <View style={styles.currencyRow}>
                                    {CURRENCIES.map(c => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[styles.chipBtn, currency === c && styles.chipBtnActive]}
                                            onPress={() => setCurrency(c)}
                                        >
                                            <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <Text style={styles.fieldLabel}>Frekvence platby</Text>
                            <View style={styles.presetRow}>
                                {BILLING_PRESETS.map(b => (
                                    <TouchableOpacity
                                        key={b.value}
                                        style={[styles.chipBtn, !customInterval && intervalDays === b.value && styles.chipBtnActive]}
                                        onPress={() => { setIntervalDays(b.value); setCustomInterval(false); }}
                                    >
                                        <Text style={[styles.chipText, !customInterval && intervalDays === b.value && styles.chipTextActive]}>{b.label}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.chipBtn, customInterval && styles.chipBtnActive]}
                                    onPress={() => setCustomInterval(true)}
                                >
                                    <Text style={[styles.chipText, customInterval && styles.chipTextActive]}>Vlastní</Text>
                                </TouchableOpacity>
                            </View>

                            {customInterval && (
                                <View style={[styles.inputWrapper, { marginTop: 8 }, customDaysFocused && styles.inputFocused]}>
                                    <View style={styles.inputWithSuffix}>
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            placeholder="Počet dní (např. 3)"
                                            placeholderTextColor="#aaa"
                                            value={customDays}
                                            onChangeText={setCustomDays}
                                            keyboardType="numeric"
                                            onFocus={() => setCustomDaysFocused(true)}
                                            onBlur={() => setCustomDaysFocused(false)}
                                        />
                                        {customDays.length > 0 && (
                                            <Text style={styles.inputSuffix}>dní</Text>
                                        )}
                                    </View>
                                </View>
                            )}

                            <Text style={styles.fieldLabel}>Datum začátku</Text>
                            <TouchableOpacity
                                style={[styles.inputWrapper, styles.datePickerBtn, styles.inputFocused]}
                                onPress={() => setDatePickerVisible(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar-outline" size={18} color="#888" style={{ marginRight: 10 }} />
                                <Text style={[styles.datePickerText, styles.datePickerTextSelected]}>
                                    {startDate}
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.dateHint}>
                                Příští vyúčtování: {calcNextBilling(startDate, customInterval ? (Number(customDays) || intervalDays) : intervalDays)}
                            </Text>

                            <Text style={styles.fieldLabel}>Zkušební období</Text>
                            <TouchableOpacity
                                style={[styles.toggleRow, hasTrial && styles.toggleRowActive]}
                                onPress={() => setHasTrial(!hasTrial)}
                            >
                                <Text style={[styles.toggleText, hasTrial && styles.toggleTextActive]}>
                                    {hasTrial ? 'Ano, má zkušební období' : 'Ne, bez zkušebního období'}
                                </Text>
                                <View style={[styles.toggleDot, hasTrial && styles.toggleDotActive]} />
                            </TouchableOpacity>

                            {hasTrial && (
                                <View style={[styles.inputWrapper, { marginTop: 8 }, trialDaysFocused && styles.inputFocused]}>
                                    <View style={styles.inputWithSuffix}>
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            placeholder="Délka trial (např. 7)"
                                            placeholderTextColor="#aaa"
                                            value={trialDays}
                                            onChangeText={setTrialDays}
                                            keyboardType="numeric"
                                            onFocus={() => setTrialDaysFocused(true)}
                                            onBlur={() => setTrialDaysFocused(false)}
                                        />
                                        {trialDays.length > 0 && (
                                            <Text style={styles.inputSuffix}>dní</Text>
                                        )}
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                                onPress={handleAdd}
                                disabled={saving}
                                activeOpacity={0.85}
                            >
                                {saving
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.saveButtonText}>Uložit</Text>
                                }
                            </TouchableOpacity>

                            <View style={{ height: 32 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f7' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f7' },
    content: { padding: 24, paddingTop: 60, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '700', color: '#111', letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: '#888', marginTop: 2 },
    fab: {
        position: 'absolute', bottom: 32, right: 24,
        backgroundColor: '#111', width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
    },
    summaryCard: { backgroundColor: '#111', borderRadius: 20, padding: 24, marginBottom: 20 },
    summaryLabel: { fontSize: 13, color: '#888', marginBottom: 6 },
    summaryAmount: { fontSize: 36, fontWeight: '700', color: '#fff', letterSpacing: -1 },
    summaryCount: { fontSize: 13, color: '#555', marginTop: 4 },
    subCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#e8e8e8', flexDirection: 'row', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
    subColorBar: { width: 5, alignSelf: 'stretch' },
    subInfo: { flex: 1, padding: 16 },
    subNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    subName: { fontSize: 16, fontWeight: '600', color: '#111', marginRight: 8 },
    trialBadge: { backgroundColor: '#f0fdf4', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#bbf7d0' },
    trialBadgeText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
    subCycle: { fontSize: 13, color: '#888', marginBottom: 2 },
    subNext: { fontSize: 12, color: '#bbb' },
    subAmountContainer: { alignItems: 'flex-end', paddingRight: 16 },
    subAmount: { fontSize: 18, fontWeight: '700', color: '#111' },
    subCurrency: { fontSize: 12, color: '#888', marginTop: 2 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8e8e8', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '600', color: '#111', marginBottom: 8 },
    emptySubtitle: { fontSize: 15, color: '#888', textAlign: 'center' },
    hint: { fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#f9f9f7', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
    fieldLabel: { fontSize: 11, fontWeight: '600', color: '#999', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    inputWrapper: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e8e8e8', paddingHorizontal: 16, paddingVertical: 14 },
    inputFocused: { borderColor: '#111' },
    input: { fontSize: 16, color: '#111', padding: 0 },
    inputWithSuffix: { flexDirection: 'row', alignItems: 'center' },
    inputSuffix: { fontSize: 14, color: '#aaa', marginLeft: 8 },
    amountRow: { flexDirection: 'row', alignItems: 'center' },
    amountInput: { flex: 1, marginRight: 10 },
    currencyRow: { flexDirection: 'row' },
    presetRow: { flexDirection: 'row', flexWrap: 'wrap' },
    chipBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#e8e8e8', marginRight: 8, marginBottom: 8, backgroundColor: '#fff' },
    chipBtnActive: { backgroundColor: '#111', borderColor: '#111' },
    chipText: { fontSize: 13, color: '#888', fontWeight: '500' },
    chipTextActive: { color: '#fff' },
    datePickerBtn: { flexDirection: 'row', alignItems: 'center' },
    datePickerText: { fontSize: 16, color: '#aaa' },
    datePickerTextSelected: { color: '#111' },
    dateHint: { fontSize: 12, color: '#888', marginTop: 6, marginLeft: 4 },
    datePickerOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 999,
    },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e8e8e8', paddingHorizontal: 16, paddingVertical: 14 },
    toggleRowActive: { borderColor: '#111' },
    toggleText: { fontSize: 15, color: '#888' },
    toggleTextActive: { color: '#111', fontWeight: '500' },
    toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#e8e8e8' },
    toggleDotActive: { backgroundColor: '#111' },
    saveButton: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    saveButtonDisabled: { backgroundColor: '#555' },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

const dpStyles = StyleSheet.create({
    container: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    navBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#f5f5f3' },
    monthLabel: { fontSize: 16, fontWeight: '600', color: '#111' },
    weekRow: { flexDirection: 'row', marginBottom: 8 },
    weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#bbb' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    cellSelected: { backgroundColor: '#111' },
    cellToday: { backgroundColor: '#f0f0ee' },
    cellText: { fontSize: 14, color: '#111' },
    cellTextSelected: { color: '#fff', fontWeight: '600' },
    cellTextToday: { fontWeight: '600', color: '#111' },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 },
    cancelText: { fontSize: 15, color: '#888' },
    confirmBtn: { backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
    confirmBtnDisabled: { backgroundColor: '#ccc' },
    confirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});