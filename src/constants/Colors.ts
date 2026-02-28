const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const Colors = {
    light: {
        text: '#0f172a', // Slate 900
        textMuted: '#64748b', // Slate 500
        background: '#fff',
        tint: tintColorLight,
        tabIconDefault: '#ccc',
        tabIconSelected: tintColorLight,
        primary: '#6366f1', // Indigo 500
        primaryDark: '#4338ca', // Indigo 700
        accent: '#f43f5e', // Rose 500
        border: '#e2e8f0', // Slate 200
        inputBg: '#f8fafc', // Slate 50
        glass: 'rgba(255, 255, 255, 0.4)',
        glassBorder: 'rgba(255, 255, 255, 0.6)',
    },
    dark: {
        text: '#fff',
        textMuted: '#94a3b8',
        background: '#0f172a',
        tint: tintColorDark,
        tabIconDefault: '#ccc',
        tabIconSelected: tintColorDark,
        primary: '#818cf8', // Indigo 400
        primaryDark: '#6366f1',
        accent: '#fb7185', // Rose 400
        border: '#334155', // Slate 700
        inputBg: '#1e293b', // Slate 800
        glass: 'rgba(15, 23, 42, 0.6)',
        glassBorder: 'rgba(255, 255, 255, 0.1)',
    },
    gradient: ['#f0f4ff', '#fff1f2', '#faf5ff', '#f0fdf4'], // Pastel Rainbow
    locations: [0, 0.35, 0.7, 1],
};
