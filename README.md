# Haemovigil

Haemovigil is a modern Angular application for haemovigilance management, featuring user authentication, patient and bag management, dashboards, and more. The project leverages Angular 19, PrimeNG, TailwindCSS, and other popular libraries for a robust, scalable, and visually appealing frontend.

## Features
- **User Authentication**: Secure login and access control using JWT.
- **Patient Management**: Add, view, and manage patient records.
- **Bag Management**: Allocate, release, and track blood bags.
- **Dashboard & Analytics**: Visualize data with Chart.js and PrimeNG components.
- **Responsive UI**: Built with TailwindCSS and PrimeNG for a seamless experience across devices.
- **Role-based Access**: Guards and interceptors for protected routes.
- **Extensible Architecture**: Modular structure for easy feature addition.

## Technologies Used
- Angular 19
- PrimeNG
- TailwindCSS
- Chart.js
- RxJS
- Auth0 Angular JWT
- Jasmine/Karma (Testing)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)
- Angular CLI (`npm install -g @angular/cli`)

### Installation
```bash
npm install
```

### Running the Application
```bash
npm start
```
Or use Angular CLI:
```bash
ng serve
```
The app will be available at `http://localhost:4200/`.

### Building for Production
```bash
npm run build
```
Or:
```bash
ng build --configuration production
```

### Running Tests
```bash
npm test
```
Or:
```bash
ng test
```

### Formatting Code
```bash
npm run format
```

## Project Structure
```
src/
  app.component.ts
  app.config.ts
  app.routes.ts
  main.ts
  styles.scss
  app/
    core/
      auth/
      models/
      services/
    features/
      bag/
      home/
      login/
      patients/
    layout/
      component/
      service/
    pages/
      auth/
      crud/
      dashboard/
      documentation/
      empty/
      landing/
      notfound/
      service/
      uikit/
  assets/
    images, styles, flags, etc.
  environments/
    environment.ts
    environment.development.ts
angular.json
package.json
tsconfig.json
tailwind.config.js
README.md
```

## Scripts
- `npm start` — Run the app in development mode
- `npm run build` — Build the app for production
- `npm test` — Run unit tests
- `npm run format` — Format code with Prettier

## Configuration
- **Environment files**: Located in `src/environments/` for different deployment targets.
- **Styles**: SCSS and TailwindCSS for custom and utility styles.
- **Routing**: Managed in `app.routes.ts` and feature modules.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.

## Contact
For questions or support, please contact the repository owner.
