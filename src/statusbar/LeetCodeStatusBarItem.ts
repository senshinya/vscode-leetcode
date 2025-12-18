// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { UserStatus } from "../shared";

export class LeetCodeStatusBarItem implements vscode.Disposable {
    private readonly statusBarItem: vscode.StatusBarItem;
    private currentStatus: UserStatus = UserStatus.SignedOut;
    private currentUser: string | undefined;
    private activeProgressName: string | undefined;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem();
        this.statusBarItem.command = "leetcode.selectProgress";
    }

    public updateStatusBar(status: UserStatus, user?: string): void {
        this.currentStatus = status;
        this.currentUser = user;
        this.refreshDisplay();
    }

    public updateActiveProgress(progressName: string | undefined): void {
        this.activeProgressName = progressName;
        this.refreshDisplay();
    }

    private refreshDisplay(): void {
        switch (this.currentStatus) {
            case UserStatus.SignedIn:
                if (this.activeProgressName) {
                    this.statusBarItem.text = `LeetCode: ${this.currentUser} [${this.activeProgressName}]`;
                } else {
                    this.statusBarItem.text = `LeetCode: ${this.currentUser}`;
                }
                break;
            case UserStatus.SignedOut:
            default:
                this.statusBarItem.text = "";
                break;
        }
    }

    public show(): void {
        this.statusBarItem.show();
    }

    public hide(): void {
        this.statusBarItem.hide();
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
