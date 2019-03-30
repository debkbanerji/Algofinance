import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import * as firebase from 'firebase/app';

import {AngularFireAuth} from '@angular/fire/auth';

@Injectable()
export class AuthService {

    user: Observable<firebase.User>;

    constructor(public afAuth: AngularFireAuth) {
        this.user = afAuth.authState;
    }

    loginWithGoogle() {
        return this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    }

    logout() {
        return this.afAuth.auth.signOut();
    }
}
