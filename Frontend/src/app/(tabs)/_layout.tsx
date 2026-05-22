import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Compass, Ticket, User } from 'lucide-react-native';
import { useThemeStore } from '@/stores/theme.store';
import { Colors } from '@/constants/theme';

function TabBarIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  const { theme } = useThemeStore();
  const c = Colors[theme];
  return (
    <LinearGradient
      colors={focused ? [c.primary + '33', c.primaryDark + '33'] : ['transparent', 'transparent']}
      style={{
        width: 44,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <React.Fragment>
        <Icon size={20} color={focused ? c.primary : c.icon} />
        <LinearGradient
          colors={focused ? [c.primary, c.primary] : ['transparent', 'transparent']}
          style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: 10, opacity: focused ? 0.15 : 0 }}
        />
      </React.Fragment>
    </LinearGradient>
  );
}

export default function TabsLayout() {
  const { theme } = useThemeStore();
  const c = Colors[theme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.background,
          borderTopColor: c.border,
          borderTopWidth: 1,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.icon,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon Icon={Home} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon Icon={Compass} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Carteira',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon Icon={Ticket} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon Icon={User} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
