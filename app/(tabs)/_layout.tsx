import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { copy } from '@/copy';
import { colors, fonts } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.storybookGold,
        tabBarInactiveTintColor: colors.parchment,
        tabBarStyle: { backgroundColor: colors.midnight, borderTopColor: colors.midnight },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.quests,
          tabBarAccessibilityLabel: copy.tabs.quests,
          tabBarIcon: tabIcon('compass-outline'),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: copy.map.title,
          tabBarAccessibilityLabel: copy.map.title,
          tabBarIcon: tabIcon('map-outline'),
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: copy.tabs.passport,
          tabBarAccessibilityLabel: copy.tabs.passport,
          tabBarIcon: tabIcon('book-outline'),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: copy.tabs.friends,
          tabBarAccessibilityLabel: copy.tabs.friends,
          tabBarIcon: tabIcon('people-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: copy.tabs.profile,
          tabBarAccessibilityLabel: copy.tabs.profile,
          tabBarIcon: tabIcon('person-circle-outline'),
        }}
      />
    </Tabs>
  );
}
