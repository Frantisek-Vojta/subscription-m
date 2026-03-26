import React, {useState, useEffect, useCallback} from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect} from 'expo-router';
import {collection, query, where, getDocs, addDoc, doc, deleteDoc} from 'firebase/firestore';
import {db, auth} from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENCIES = ['CZK'];
const BILLING_PRESETS = [
    {label: 'Weekly', value: 7},
    {label: '2 weeks', value: 14},
    {label: 'Monthly', value: 30},
    {label: 'Yearly', value: 365},
];
const SUB_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Subscription = {
    id: string; name: string; amount: number; currency: string;
    intervalDays: number; customInterval: boolean; startDate: string; nextBilling: string; color: string;
};

function daysToLabel(days: number): string {
    if (days === 7) return 'Weekly';
    if (days === 14) return 'Every 2 weeks';
    if (days === 30) return 'Monthly';
    if (days === 365) return 'Yearly';
    return `Every ${days} days`;
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
    let next = new Date(start);
    while (next <= today) next.setDate(next.getDate() + intervalDays);
    return formatDate(next);
}

function nextBillingLabel(startDateStr: string, intervalDays: number): string {
    if (!startDateStr || intervalDays < 1) return '';
    const next = calcNextBilling(startDateStr, intervalDays);
    const days = daysUntil(next);
    if (days === 0) return `Next billing: today (${next})`;
    if (days === 1) return `Next billing: tomorrow (${next})`;
    return `Next billing: in ${days} days (${next})`;
}

function DatePickerInline({onClose, onSelect, dark}: {
    onClose: () => void;
    onSelect: (date: string) => void;
    dark: boolean;
}) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
    const [selected, setSelected] = useState<{ day: number; month: number; year: number } | null>(null);

    const daysInMonth = getDaysInMonth(viewMonth, viewYear);
    const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const prevMonth = () => {
        if (viewMonth === 1) {
            setViewMonth(12);
            setViewYear(y => y - 1);
        } else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 12) {
            setViewMonth(1);
            setViewYear(y => y + 1);
        } else setViewMonth(m => m + 1);
    };

    const handleConfirm = () => {
        if (!selected) return;
        onSelect(formatDateFromParts(selected.day, selected.month, selected.year));
        onClose();
    };

    const isSelected = (day: number) => selected?.day === day && selected?.month === viewMonth && selected?.year === viewYear;
    const isToday = (day: number) => today.getDate() === day && today.getMonth() + 1 === viewMonth && today.getFullYear() === viewYear;

    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);

    const bg = dark ? '#1a1a1a' : '#fff';
    const tp = dark ? '#fff' : '#111';
    const ts = dark ? '#888' : '#888';
    const navBg = dark ? '#2a2a2a' : '#f5f5f3';
    const todayBg = dark ? '#2a2a2a' : '#f0f0ee';

    return (
        <View style={[dpStyles.container, {backgroundColor: bg}]}>
            <View style={dpStyles.header}>
                <TouchableOpacity onPress={prevMonth} style={[dpStyles.navBtn, {backgroundColor: navBg}]}>
                    <Ionicons name="chevron-back" size={20} color={tp}/>
                </TouchableOpacity>
                <Text style={[dpStyles.monthLabel, {color: tp}]}>{MONTHS[viewMonth - 1]} {viewYear}</Text>
                <TouchableOpacity onPress={nextMonth} style={[dpStyles.navBtn, {backgroundColor: navBg}]}>
                    <Ionicons name="chevron-forward" size={20} color={tp}/>
                </TouchableOpacity>
            </View>
            <View style={dpStyles.weekRow}>
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                    <Text key={d} style={[dpStyles.weekDay, {color: ts}]}>{d}</Text>
                ))}
            </View>
            <View style={dpStyles.grid}>
                {cells.map((day, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[dpStyles.cell, day !== null && isSelected(day) && {backgroundColor: tp}, day !== null && isToday(day) && !isSelected(day) && {backgroundColor: todayBg}]}
                        onPress={() => day !== null && setSelected({day, month: viewMonth, year: viewYear})}
                        disabled={day === null}
                        activeOpacity={0.7}
                    >
                        {day !== null && (
                            <Text
                                style={[dpStyles.cellText, {color: isSelected(day) ? bg : tp}, (isSelected(day) || isToday(day) && !isSelected(day)) && {fontWeight: '600'}]}>
                                {day}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
            <View style={dpStyles.footer}>
                <TouchableOpacity style={dpStyles.cancelBtn} onPress={onClose}>
                    <Text style={[dpStyles.cancelText, {color: ts}]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[dpStyles.confirmBtn, {backgroundColor: tp}, !selected && {backgroundColor: dark ? '#333' : '#ccc'}]}
                    onPress={handleConfirm}
                    disabled={!selected}
                >
                    <Text style={[dpStyles.confirmText, {color: bg}]}>Confirm</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function HomeScreen() {
    const [darkMode, setDarkMode] = useState(false);
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
    const [nameError, setNameError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [customDaysError, setCustomDaysError] = useState('');
    const [nameFocused, setNameFocused] = useState(false);
    const [amountFocused, setAmountFocused] = useState(false);
    const [customDaysFocused, setCustomDaysFocused] = useState(false);

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

    const d = darkMode;
    const bg = d ? '#111' : '#f9f9f7';
    const cardBg = d ? '#1a1a1a' : '#fff';
    const cardBorder = d ? '#2a2a2a' : '#e8e8e8';
    const tp = d ? '#fff' : '#111';
    const ts = d ? '#888' : '#888';
    const modalBg = d ? '#1a1a1a' : '#f9f9f7';
    const inputBg = d ? '#2a2a2a' : '#fff';
    const inputBorder = d ? '#333' : '#e8e8e8';

    const loadSubscriptions = async (uid: string) => {
        try {
            if (!db) {
                setLoading(false);
                return;
            }
            const q = query(collection(db, 'subscriptions'), where('userId', '==', uid));
            const snapshot = await getDocs(q);
            const subs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})) as Subscription[];
            setSubscriptions(subs);
        } catch (error) {
            console.log('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFinalDays = () => customInterval ? Number(customDays) : intervalDays;

    const handleAdd = async () => {
        let valid = true;
        if (!name.trim()) {
            setNameError('Enter a subscription name');
            valid = false;
        } else setNameError('');
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setAmountError('Enter a valid amount');
            valid = false;
        } else setAmountError('');
        const finalDays = getFinalDays();
        if (customInterval && (!customDays || isNaN(finalDays) || finalDays < 1)) {
            setCustomDaysError('Enter a valid number of days');
            valid = false;
        } else setCustomDaysError('');
        if (!valid) return;
        const uid = auth?.currentUser?.uid;
        if (!uid) {
            Alert.alert('Error', 'You are not logged in');
            return;
        }
        if (!db) {
            Alert.alert('Error', 'Database not available');
            return;
        }
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
                color,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, 'subscriptions'), newSub);
            setSubscriptions(prev => [...prev, {id: docRef.id, ...newSub}]);
            resetForm();
            setModalVisible(false);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to save: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete', 'Are you sure you want to delete this subscription?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        if (!db) return;
                        await deleteDoc(doc(db, 'subscriptions', id));
                        setSubscriptions(prev => prev.filter(s => s.id !== id));
                    } catch {
                        Alert.alert('Error', 'Failed to delete subscription');
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
        setNameError('');
        setAmountError('');
        setCustomDaysError('');
        setDatePickerVisible(false);
    };

    const totalMonthly = subscriptions.reduce((sum, s) => sum + (s.amount / s.intervalDays) * 30, 0);
    const previewLabel = nextBillingLabel(startDate, getFinalDays());

    if (loading) return <View style={[styles.loadingContainer, {backgroundColor: bg}]}><ActivityIndicator size="large"
                                                                                                          color={tp}/></View>;

    return (
        <View style={[styles.container, {backgroundColor: bg}]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, {color: tp}]}>Subscriptions</Text>
                    <Text style={[styles.subtitle, {color: ts}]}>Spending overview</Text>
                </View>

                {subscriptions.length > 0 && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Monthly expenses (estimate)</Text>
                        <Text style={styles.summaryAmount}>{totalMonthly.toFixed(0)} CZK</Text>
                        <Text style={styles.summaryCount}>{subscriptions.length} subscriptions</Text>
                    </View>
                )}

                {subscriptions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconBox, {backgroundColor: cardBg, borderColor: cardBorder}]}>
                            <Ionicons name="card-outline" size={36} color={ts}/>
                        </View>
                        <Text style={[styles.emptyTitle, {color: tp}]}>No subscriptions</Text>
                        <Text style={[styles.emptySubtitle, {color: ts}]}>Add your first subscription using the +
                            button</Text>
                    </View>
                ) : (
                    subscriptions.map((sub) => {
                        const days = daysUntil(sub.nextBilling);
                        return (
                            <TouchableOpacity key={sub.id} style={[styles.subCard, {
                                backgroundColor: cardBg,
                                borderColor: cardBorder
                            }]} onLongPress={() => handleDelete(sub.id)} activeOpacity={0.8}>
                                <View style={[styles.subColorBar, {backgroundColor: sub.color}]}/>
                                <View style={styles.subInfo}>
                                    <Text style={[styles.subName, {color: tp}]}>{sub.name}</Text>
                                    <Text style={[styles.subCycle, {color: ts}]}>{daysToLabel(sub.intervalDays)}</Text>
                                    <Text style={[styles.subNext, {color: d ? '#555' : '#bbb'}]}>
                                        {days < 0 ? 'Payment overdue' : days === 0 ? 'Payment today' : `Next payment in ${days} ${days === 1 ? 'day' : 'days'}`}
                                    </Text>
                                </View>
                                <View style={styles.subAmountContainer}>
                                    <Text style={[styles.subAmount, {color: tp}]}>{sub.amount}</Text>
                                    <Text style={[styles.subCurrency, {color: ts}]}>{sub.currency}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                {subscriptions.length > 0 &&
                    <Text style={[styles.hint, {color: d ? '#444' : '#ccc'}]}>Hold to delete a subscription</Text>}
            </ScrollView>

            <TouchableOpacity style={[styles.fab, {backgroundColor: d ? '#fff' : '#111'}]}
                              onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={28} color={d ? '#111' : '#fff'}/>
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    {datePickerVisible && (
                        <View style={styles.datePickerOverlay}>
                            <DatePickerInline onClose={() => setDatePickerVisible(false)} onSelect={(date) => {
                                setStartDate(date);
                                setDatePickerVisible(false);
                            }} dark={darkMode}/>
                        </View>
                    )}
                    <View style={[styles.modalContent, {backgroundColor: modalBg}]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, {color: tp}]}>New subscription</Text>
                            <TouchableOpacity onPress={() => {
                                setModalVisible(false);
                                resetForm();
                            }}>
                                <Ionicons name="close" size={24} color={ts}/>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <Text style={[styles.fieldLabel, {color: ts}]}>Name</Text>
                            <View style={[styles.inputWrapper, {
                                backgroundColor: inputBg,
                                borderColor: nameFocused ? tp : (nameError ? '#ff4444' : inputBorder)
                            }]}>
                                <TextInput style={[styles.input, {color: tp}]} placeholder="Netflix, Spotify..."
                                           placeholderTextColor={ts} value={name} onChangeText={(t) => {
                                    setName(t);
                                    if (t.trim()) setNameError('');
                                }} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)}/>
                            </View>
                            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

                            <Text style={[styles.fieldLabel, {color: ts}]}>Amount</Text>
                            <View style={styles.amountRow}>
                                <View style={[styles.inputWrapper, styles.amountInput, {
                                    backgroundColor: inputBg,
                                    borderColor: amountFocused ? tp : (amountError ? '#ff4444' : inputBorder)
                                }]}>
                                    <TextInput style={[styles.input, {color: tp}]} placeholder="0"
                                               placeholderTextColor={ts} value={amount} onChangeText={(t) => {
                                        setAmount(t);
                                        if (t && !isNaN(Number(t))) setAmountError('');
                                    }} keyboardType="numeric" onFocus={() => setAmountFocused(true)}
                                               onBlur={() => setAmountFocused(false)}/>
                                </View>
                            </View>
                            {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}

                            <Text style={[styles.fieldLabel, {color: ts}]}>Billing frequency</Text>
                            <View style={styles.presetRow}>
                                {BILLING_PRESETS.map(b => (
                                    <TouchableOpacity key={b.value} style={[styles.chipBtn, {
                                        backgroundColor: !customInterval && intervalDays === b.value ? tp : inputBg,
                                        borderColor: !customInterval && intervalDays === b.value ? tp : inputBorder
                                    }]} onPress={() => {
                                        setIntervalDays(b.value);
                                        setCustomInterval(false);
                                        setCustomDaysError('');
                                    }}>
                                        <Text
                                            style={[styles.chipText, {color: !customInterval && intervalDays === b.value ? (d ? '#111' : '#fff') : ts}]}>{b.label}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity style={[styles.chipBtn, {
                                    backgroundColor: customInterval ? tp : inputBg,
                                    borderColor: customInterval ? tp : inputBorder
                                }]} onPress={() => setCustomInterval(true)}>
                                    <Text
                                        style={[styles.chipText, {color: customInterval ? (d ? '#111' : '#fff') : ts}]}>Custom</Text>
                                </TouchableOpacity>
                            </View>

                            {customInterval && (
                                <>
                                    <View style={[styles.inputWrapper, {
                                        marginTop: 8,
                                        backgroundColor: inputBg,
                                        borderColor: customDaysFocused ? tp : (customDaysError ? '#ff4444' : inputBorder)
                                    }]}>
                                        <View style={styles.inputWithSuffix}>
                                            <TextInput style={[styles.input, {flex: 1, color: tp}]}
                                                       placeholder="Number of days (e.g. 3)" placeholderTextColor={ts}
                                                       value={customDays} onChangeText={(t) => {
                                                setCustomDays(t);
                                                if (t && Number(t) > 0) setCustomDaysError('');
                                            }} keyboardType="numeric" onFocus={() => setCustomDaysFocused(true)}
                                                       onBlur={() => setCustomDaysFocused(false)}/>
                                            {customDays.length > 0 &&
                                                <Text style={[styles.inputSuffix, {color: ts}]}>days</Text>}
                                        </View>
                                    </View>
                                    {customDaysError ? <Text style={styles.errorText}>{customDaysError}</Text> : null}
                                </>
                            )}

                            <Text style={[styles.fieldLabel, {color: ts}]}>Start date</Text>
                            <TouchableOpacity style={[styles.inputWrapper, styles.datePickerBtn, {
                                backgroundColor: inputBg,
                                borderColor: tp
                            }]} onPress={() => setDatePickerVisible(true)} activeOpacity={0.7}>
                                <Ionicons name="calendar-outline" size={18} color={ts} style={{marginRight: 10}}/>
                                <Text style={[styles.datePickerText, {color: tp}]}>{startDate}</Text>
                            </TouchableOpacity>
                            {previewLabel ? <Text style={[styles.dateHint, {color: ts}]}>{previewLabel}</Text> : null}

                            <TouchableOpacity
                                style={[styles.saveButton, {backgroundColor: tp}, saving && {backgroundColor: d ? '#333' : '#555'}]}
                                onPress={handleAdd} disabled={saving} activeOpacity={0.85}>
                                {saving ? <ActivityIndicator color={d ? '#111' : '#fff'}/> :
                                    <Text style={[styles.saveButtonText, {color: d ? '#111' : '#fff'}]}>Save</Text>}
                            </TouchableOpacity>
                            <View style={{height: 32}}/>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    content: {padding: 24, paddingTop: 60, paddingBottom: 100},
    header: {marginBottom: 24},
    title: {fontSize: 28, fontWeight: '700', letterSpacing: -0.5},
    subtitle: {fontSize: 15, marginTop: 2},
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6
    },
    summaryCard: {backgroundColor: '#111', borderRadius: 20, padding: 24, marginBottom: 20},
    summaryLabel: {fontSize: 13, color: '#888', marginBottom: 6},
    summaryAmount: {fontSize: 36, fontWeight: '700', color: '#fff', letterSpacing: -1},
    summaryCount: {fontSize: 13, color: '#555', marginTop: 4},
    subCard: {
        borderRadius: 16,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden'
    },
    subColorBar: {width: 5, alignSelf: 'stretch'},
    subInfo: {flex: 1, padding: 16},
    subName: {fontSize: 16, fontWeight: '600', marginBottom: 3},
    subCycle: {fontSize: 13, marginBottom: 2},
    subNext: {fontSize: 12},
    subAmountContainer: {alignItems: 'flex-end', paddingRight: 16},
    subAmount: {fontSize: 18, fontWeight: '700'},
    subCurrency: {fontSize: 12, marginTop: 2},
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
    hint: {fontSize: 12, textAlign: 'center', marginTop: 8},
    modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
    modalContent: {borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%'},
    modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20},
    modalTitle: {fontSize: 20, fontWeight: '700'},
    fieldLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 16
    },
    inputWrapper: {borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14},
    input: {fontSize: 16, padding: 0},
    inputWithSuffix: {flexDirection: 'row', alignItems: 'center'},
    inputSuffix: {fontSize: 14, marginLeft: 8},
    amountRow: {flexDirection: 'row', alignItems: 'center'},
    amountInput: {flex: 1, marginRight: 10},
    currencyRow: {flexDirection: 'row'},
    presetRow: {flexDirection: 'row', flexWrap: 'wrap'},
    chipBtn: {
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1.5,
        marginRight: 8,
        marginBottom: 8
    },
    chipText: {fontSize: 13, fontWeight: '500'},
    errorText: {color: '#ff4444', fontSize: 12, marginTop: 4, marginBottom: 4, marginLeft: 4},
    datePickerBtn: {flexDirection: 'row', alignItems: 'center'},
    datePickerText: {fontSize: 16},
    dateHint: {fontSize: 12, marginTop: 6, marginLeft: 4},
    datePickerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        zIndex: 999
    },
    saveButton: {borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24},
    saveButtonText: {fontSize: 16, fontWeight: '600'},
});

const dpStyles = StyleSheet.create({
    container: {borderRadius: 20, padding: 20, width: '100%'},
    header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
    navBtn: {width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 10},
    monthLabel: {fontSize: 16, fontWeight: '600'},
    weekRow: {flexDirection: 'row', marginBottom: 8},
    weekDay: {flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600'},
    grid: {flexDirection: 'row', flexWrap: 'wrap'},
    cell: {width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8},
    cellText: {fontSize: 14},
    footer: {flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16},
    cancelBtn: {paddingHorizontal: 16, paddingVertical: 10, marginRight: 8},
    cancelText: {fontSize: 15},
    confirmBtn: {borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10},
    confirmText: {fontSize: 15, fontWeight: '600'},
});