import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function AppDatePickerModal({
  maximumDate,
  minimumDate,
  onClose,
  onSelect,
  selectedDate,
  title,
  visible,
}: {
  maximumDate: Date;
  minimumDate: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
  title: string;
  visible: boolean;
}) {
  const initialDate = clampDate(selectedDate ?? minimumDate, minimumDate, maximumDate);
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth());
  const [day, setDay] = useState(initialDate.getDate());

  const months = useMemo(() => {
    const result: { index: number; year: number }[] = [];
    const cursor = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1);
    const end = new Date(maximumDate.getFullYear(), maximumDate.getMonth(), 1);
    while (cursor <= end) {
      result.push({ index: cursor.getMonth(), year: cursor.getFullYear() });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }, [maximumDate, minimumDate]);
  const selectableYears = useMemo(() => [...new Set(months.map((option) => option.year))], [months]);
  const displayedYears = useMemo(() => {
    const firstYear = minimumDate.getFullYear();
    const lastYear = maximumDate.getFullYear();

    return Array.from({ length: lastYear - firstYear + 3 }, (_, index) => firstYear - 1 + index);
  }, [maximumDate, minimumDate]);
  const displayedMonths = monthNames.map((_, index) => index);
  const days = Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1);
  const candidate = new Date(year, month, day);
  const selectedCandidate = isWithinRange(candidate, minimumDate, maximumDate)
    ? candidate
    : clampDate(candidate, minimumDate, maximumDate);

  useEffect(() => {
    if (!visible) return;
    const next = clampDate(selectedDate ?? minimumDate, minimumDate, maximumDate);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setDay(next.getDate());
  }, [maximumDate, minimumDate, selectedDate, visible]);

  const selectMonth = (monthIndex: number) => {
    setMonth(monthIndex);
    setDay((current) => Math.min(current, daysInMonth(year, monthIndex)));
  };

  const selectYear = (nextYear: number) => {
    const nextMonths = months.filter((option) => option.year === nextYear);
    const nextMonth = nextMonths.some((option) => option.index === month) ? month : nextMonths[0]?.index ?? month;
    setYear(nextYear);
    setMonth(nextMonth);
    setDay((current) => Math.min(current, daysInMonth(nextYear, nextMonth)));
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.selectedDate}>{formatDate(selectedCandidate)}</Text>
          <Text style={styles.rangeNote}>
            Available from {formatShortDate(minimumDate)} to {formatShortDate(maximumDate)}
          </Text>

          <View style={styles.pickerGrid}>
            <PickerColumn selectedIndex={month} title="Month">
              {displayedMonths.map((monthIndex) => (
                <PickerOption
                  disabled={!monthOverlapsRange(year, monthIndex, minimumDate, maximumDate)}
                  key={`${year}-${monthIndex}`}
                  label={monthNames[monthIndex].slice(0, 3)}
                  onPress={() => selectMonth(monthIndex)}
                  selected={month === monthIndex}
                />
              ))}
            </PickerColumn>
            <PickerColumn selectedIndex={day - 1} title="Day">
              {days.map((optionDay) => {
                const date = new Date(year, month, optionDay);
                return (
                  <PickerOption
                    disabled={!isWithinRange(date, minimumDate, maximumDate)}
                    key={optionDay}
                    label={`${optionDay}`}
                    onPress={() => setDay(optionDay)}
                    selected={day === optionDay}
                  />
                );
              })}
            </PickerColumn>
            <PickerColumn selectedIndex={displayedYears.indexOf(year)} title="Year">
              {displayedYears.map((optionYear) => (
                <PickerOption
                  disabled={!selectableYears.includes(optionYear)}
                  key={optionYear}
                  label={`${optionYear}`}
                  onPress={() => selectYear(optionYear)}
                  selected={year === optionYear}
                />
              ))}
            </PickerColumn>
          </View>

          <Pressable
            onPress={() => onSelect(selectedCandidate)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Use Date</Text>
          </Pressable>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PickerColumn({
  children,
  selectedIndex,
  title,
}: {
  children: React.ReactNode;
  selectedIndex: number;
  title: string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const optionStride = 43;

  useEffect(() => {
    if (selectedIndex < 0) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        animated: false,
        y: Math.max(0, selectedIndex * optionStride - optionStride),
      });
    });
  }, [selectedIndex]);

  return (
    <View style={styles.column}>
      <Text style={styles.columnTitle}>{title}</Text>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.optionList}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

function PickerOption({
  disabled = false,
  label,
  onPress,
  selected,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected, disabled && styles.optionTextDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isWithinRange(date: Date, minimumDate: Date, maximumDate: Date) {
  const value = startOfDay(date).getTime();
  return value >= startOfDay(minimumDate).getTime() && value <= startOfDay(maximumDate).getTime();
}

function monthOverlapsRange(year: number, month: number, minimumDate: Date, maximumDate: Date) {
  const firstDay = startOfDay(new Date(year, month, 1)).getTime();
  const lastDay = startOfDay(new Date(year, month + 1, 0)).getTime();

  return firstDay <= startOfDay(maximumDate).getTime() && lastDay >= startOfDay(minimumDate).getTime();
}

function clampDate(date: Date, minimumDate: Date, maximumDate: Date) {
  if (date < minimumDate) return new Date(minimumDate);
  if (date > maximumDate) return new Date(maximumDate);
  return new Date(date);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-PH', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-PH', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: 'rgba(18, 24, 20, 0.42)', flex: 1, justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: '#FFFFFF', borderRadius: theme.radius.lg, gap: 12, maxWidth: 430, padding: 20, width: '100%' },
  title: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 18, textAlign: 'center' },
  selectedDate: { color: theme.colors.primary, fontFamily: Fonts.sansSemiBold, fontSize: 15, textAlign: 'center' },
  rangeNote: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 11, textAlign: 'center' },
  pickerGrid: { flexDirection: 'row', gap: 8, height: 246 },
  column: { flex: 1, gap: 7 },
  columnTitle: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 12, textAlign: 'center' },
  optionList: { gap: 5, paddingBottom: 4 },
  option: { alignItems: 'center', borderColor: '#D0D0D0', borderRadius: theme.radius.sm, borderWidth: 1, justifyContent: 'center', minHeight: 38 },
  optionSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  optionDisabled: { backgroundColor: '#F3F3F3', borderColor: '#E3E3E3' },
  optionText: { color: theme.colors.text, fontFamily: Fonts.sansMedium, fontSize: 13 },
  optionTextSelected: { color: theme.colors.white },
  optionTextDisabled: { color: '#B8B8B8' },
  primaryButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 50 },
  primaryButtonText: { color: theme.colors.white, fontFamily: Fonts.sansBold, fontSize: 14 },
  secondaryButton: { alignItems: 'center', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, justifyContent: 'center', minHeight: 48 },
  secondaryButtonText: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
});
