# Subscription Manager

Mobilní aplikace pro správu předplatných postavená na React Native (Expo) a Firebase.

## Funkce

- Přihlášení a registrace přes email
- Přidávání předplatných s názvem, částkou, měnou a frekvencí platby
- Automatický výpočet příštího vyúčtování
- Vlastní frekvence platby (např. každé 3 dny)
- Přehled měsíčních výdajů
- Data uložena v Firebase Firestore – každý uživatel vidí jen svá předplatná

## Požadavky

- Node.js verze 18 nebo novější (https://nodejs.org/)
- Účet na Firebase (https://firebase.google.com/)
- Android emulátor, iOS simulátor nebo telefon s Expo Go (https://expo.dev/go)

## Instalace

### 1. Klonování repozitáře

git clone https://github.com/Frantisek-Vojta/subscription-m.git
cd subscription-m

### 2. Instalace závislostí

npm install

### 3. Nastavení Firebase

1. Jdi na console.firebase.google.com
2. Vytvoř nový projekt
3. Přidej webovou aplikaci (ikona </>)
4. Zkopíruj konfiguraci Firebase
5. V projektu zapni Authentication → Email/Password
6. Vytvoř Firestore Database → Start in test mode → region europe-west

### 4. Nastavení proměnných prostředí

Vytvoř soubor .env v kořenové složce projektu:

EXPO_PUBLIC_FIREBASE_API_KEY=tvuj-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tvuj-projekt.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tvuj-projekt-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tvuj-projekt.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
EXPO_PUBLIC_FIREBASE_MEASUREMENT=G-XXXXXXXXXX

Hodnoty najdeš ve Firebase Console → Nastavení projektu → Tvoje aplikace.

### 5. Spuštění aplikace

npx expo start

Po spuštění máš tyto možnosti:
- Stiskni w pro otevření v prohlížeči
- Stiskni a pro Android emulátor
- Stiskni i pro iOS simulátor
- Naskenuj QR kód v Expo Go na telefonu

## Firebase pravidla (Firestore)

Po ukončení vývoje nahraď testovací pravidla těmito:

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
match /subscriptions/{document} {
allow read, write: if request.auth != null
&& request.auth.uid == resource.data.userId;
allow create: if request.auth != null
&& request.auth.uid == request.resource.data.userId;
}
}
}

## Technologie

- Expo ~54
- React Native 0.81
- Expo Router ~6
- Firebase ^12 (Auth + Firestore)
- TypeScript

## Vývoj

Reset projektu na čistý stav:
npm run reset-project

Lint:
npm run lint