import {Component, NgZone, OnInit} from '@angular/core';
import {AngularFireDatabase, AngularFireList,} from '@angular/fire/database';
import {AuthService} from '../providers/auth.service';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';

@Component({
    selector: 'app-insurance-overview',
    templateUrl: './insurance-overview.component.html',
    styleUrls: ['./insurance-overview.component.css'],
})
export class ViewClientsComponent implements OnInit {

    public userValueChanges: Observable<any[]>;

    private userList: AngularFireList<any>;

    public userUID: string;

    constructor(private db: AngularFireDatabase,
                public authService: AuthService,
                private router: Router,
                private ngZone: NgZone
    ) {
        const component = this;
        component.authService.afAuth.auth.onAuthStateChanged((auth) => {
            if (auth != null) {
                const path = '/user-profiles';
                //component.userUID = auth.uid;
                component.ngZone.run(function () {
                    component.userList = db.list(path);
                    component.userValueChanges = component.userList.snapshotChanges();

                });
            } else {
                component.ngZone.run(function () {
                    component.router.navigate(['login']);
                });
            }
        });
    }

    ngOnInit() {
    }




}
