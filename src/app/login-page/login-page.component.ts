import {Component, OnInit, OnDestroy, NgZone} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireDatabase} from '@angular/fire/database';
import {AuthService} from '../providers/auth.service';
import {Subscription} from 'rxjs';
import {MatSnackBar} from "@angular/material";

declare let sjcl;

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit, OnDestroy {
    private userDataSubscription: Subscription;
    public LOGO_URL: string;
    public GOOGLE_URL: string;
    public loginAsAgent: boolean;
    public agentPassKey: string = '';

    public validHashes = [
        '88D4266FD4E6338D13B845FCF289579D209C897823B9217DA3E161936F031589',
        '297ECEBFA892D9186F261AAE5953B6B61C45A2587FFF26145F9CAC74DF060FA2',
        'F4AA0655CDB8D4FCF6F719C7A786DE10556783C70BFB8EF1D78923482FE6EBBC',
        'B9DD960C1753459A78115D3CB845A57D924B6877E805B08BD01086CCDF34433C'
    ];

    constructor(public authService: AuthService, private db: AngularFireDatabase, private router: Router, private ngZone: NgZone, public snackBar: MatSnackBar) {
    }

    ngOnInit() {
        this.LOGO_URL = '/assets/images/logo.png';
        this.GOOGLE_URL = '/assets/images/google.png';
    }

    loginWithGoogle() {
        const component = this;
        this.authService.loginWithGoogle().then((loginData) => {
            this.authService.afAuth.auth.onAuthStateChanged((auth) => {
                if (auth != null) {
                    const bitArray = sjcl.hash.sha256.hash(component.agentPassKey.toLowerCase());
                    const passKeyHash = sjcl.codec.hex.fromBits(bitArray);
                    let containsHash = false;
                    for (let i = 0; i < component.validHashes.length; i++) {
                        containsHash = containsHash || (component.validHashes[i].toLowerCase() === passKeyHash);
                    }
                    if (containsHash) {
                        component.showMessage('Unlocking agent privileges');
                    } else if (component.loginAsAgent) {
                        component.showMessage('Unrecognized passkey - triggering regular login');
                    }
                    if (!containsHash) {
                        component.loginAsAgent = false;
                    }
                    const profileObject = component.db.object('/' + (component.loginAsAgent ? 'agent' : 'user') + '-profiles/' + auth.uid);
                    profileObject.set({
                        'uid': auth.uid,
                        'email': auth.email,
                        'display-name': auth.displayName,
                        'photo-url': auth.photoURL
                    }).then(_ => {
                        if (!component.loginAsAgent) {
                            component.finishClientLogin(auth);
                        } else {
                            component.ngZone.run(function () {
                                component.showMessage('Logged in as agent');
                                component.router.navigate(['view-clients']);
                            });
                        }
                    });
                }
            });
        });
    }

    private finishClientLogin(auth) {
        const component = this;
        const userInsuranceListObj = component.db.object('/user-insurance-lists/' + auth.uid);
        userInsuranceListObj.query.once('value').then((existsResult) => {
            // result is the returned items json
            if (existsResult.exists()) {
                // something is returned
                component.ngZone.run(function () {
                    component.router.navigate(['']);
                });
            } else {
                // create the insurance list
                const defaultInsuranceList = component.db.object('/default-insurance-data/');
                defaultInsuranceList.query.once('value').then((defaultResult) => {
                    const defaultList = defaultResult.val();
                    const keyset = Object.keys(defaultList);
                    const userList = {};
                    for (let i = 0; i < keyset.length; i++) {
                        const item = defaultList[keyset[i]];
                        userList[keyset[i]] = {
                            'name': item['name'],
                            'cost': item['default-cost'],
                            'importance': item['default-importance'],
                            'description': item['description'],
                            'url': item['url']
                        }
                    }
                    userInsuranceListObj.set(userList).then(() => {
                        component.ngZone.run(function () {
                            component.router.navigate(['']);
                        });
                    });

                });
            }
        });
    }

    ngOnDestroy() {
        if (this.userDataSubscription) {
            this.userDataSubscription.unsubscribe();
        }
    }

    showMessage(message: string) {
        const component = this;
        component.snackBar.open(message, null, {
            duration: 2000,
        });
    }
}
