# Dashboard Learning Listing

## Description

**Dashboard Learning Listing** est un projet visant à lister toutes les sessions de formation des promotions chez O'clock qui ont lieu sur BigBlueButton (BBB). Ce dashboard permet aux utilisateurs de visualiser et de suivre facilement toutes les sessions de formation en cours et passées, ainsi que d'obtenir des détails sur chaque session.

## Prérequis

- Next.js (version 14 ou supérieure)
- npm (version 6 ou supérieure)

## Installation

1. Clonez le dépôt :

    ```bash
    git clone https://github.com/O-clock-Dev/learning-dashboard-listing.git
    cd learning-dashboard-listing
    ```

2. Installez les dépendances :

    ```bash
    npm install
    ```

3. Générez la clé NextAuth :

    ```bash
    openssl rand -base64 32
    ```

4. Configurez les variables d'environnement en créant un fichier `.env` à la racine du projet et en y ajoutant les informations suivantes :

    ```
    # Keycloak config
    KEYCLOAK_CLIENT_ID="learning-dashboard-listing"
    KEYCLOAK_CLIENT_SECRET="secret super sécurisé"
    KEYCLOAK_ISSUER="https://auth.oclock.io/realms/oclock"
    # NextAuth config
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="secret nextauth généré avec openssl rand -base64 32"
    # App config
    LEARNING_DASHBOARD_FOLDER="/chemin/vers/learning-dashboard"
    LEARNING_DASHBOARD_BASEURL="https://bbb1.oclock.school"
    REPLAYS_FOLDER="/chemin/vers/published/presentation"
    SKIP_KEYCLOAK=false
    ```

    Dev : La configuration Keycloak n'est pas necessaire si vous utilisz ``SKIP_KEYCLOAK=true``
    Pareil en mode Dev une liste préfaite de ligne est importé dans le fichier "datas/coursesDev.json" ce fichier peut-etre récupéré en production (si vous le voulez a jour) via <https://playback.oclock.school/dashboards/api/generate-courses-list>


5. Lancez l'application :

    ```bash
    npm build
    npm start
    ```

## Utilisation

Une fois l'application lancée, ouvrez votre navigateur et accédez à `http://localhost:3000`. Vous pourrez alors naviguer dans le tableau de bord pour voir toutes les sessions de formation des promotions chez O'clock.
