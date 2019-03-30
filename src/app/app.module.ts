import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {RouterModule, Routes} from '@angular/router';

// Angular Material Imports
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
    MatAutocompleteModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatChipsModule, MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule, MatSidenavModule, MatSlideToggleModule, MatSnackBarModule, MatSortModule, MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule
} from '@angular/material';

import {AngularFireModule} from '@angular/fire';
import 'hammerjs';
import {environment} from '../environments/environment';
import {AngularFireDatabaseModule} from '@angular/fire/database';
import {AngularFireAuthModule} from '@angular/fire/auth';


import {AppComponent} from './app.component';
import {AuthService} from './providers/auth.service';
import {LoginPageComponent} from './login-page/login-page.component';
import {HomePageComponent} from './home-page/home-page.component';
import {config} from './config/firebase-config';
import {NavBarComponent} from './nav-bar/nav-bar.component';
import {InsuranceOverviewComponent} from './insurance-overview/insurance-overview.component';

const routes: Routes = [ // Array of all routes - modify when adding routes //TODO: Replace
    {path: '', component: HomePageComponent}, // Default route
    {path: 'login', component: LoginPageComponent},
    {path: 'insurance-overview', component: InsuranceOverviewComponent}
];

@NgModule({
    declarations: [
        AppComponent,
        LoginPageComponent,
        HomePageComponent,
        NavBarComponent,
        InsuranceOverviewComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        AngularFireModule.initializeApp(config),
        AngularFireDatabaseModule,
        AngularFireAuthModule,
        BrowserAnimationsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatChipsModule,
        MatTooltipModule,
        MatToolbarModule,
        MatSidenavModule,
        MatTabsModule,
        MatSlideToggleModule,
        MatCheckboxModule,
        MatSnackBarModule,
        MatInputModule,
        MatTableModule,
        MatSortModule,
        RouterModule.forRoot(routes)
    ],
    providers: [AuthService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
