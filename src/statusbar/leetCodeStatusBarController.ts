// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ConfigurationChangeEvent, Disposable, workspace, WorkspaceConfiguration } from "vscode";
import { UserStatus } from "../shared";
import { LeetCodeStatusBarItem } from "./LeetCodeStatusBarItem";
import { progressManager } from "../progress/progressManager";

class LeetCodeStatusBarController implements Disposable {
    private statusBar: LeetCodeStatusBarItem;
    private configurationChangeListener: Disposable;
    private progressSelectedHandler: (progressName: string | undefined) => void;

    constructor() {
        this.statusBar = new LeetCodeStatusBarItem();
        this.setStatusBarVisibility();

        this.configurationChangeListener = workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
            if (event.affectsConfiguration("leetcode.enableStatusBar")) {
                this.setStatusBarVisibility();
            }
        }, this);

        // Listen for progress selection changes
        this.progressSelectedHandler = (progressName: string | undefined) => {
            this.statusBar.updateActiveProgress(progressName);
        };
        progressManager.on("progressSelected", this.progressSelectedHandler);
    }

    /**
     * Initializes the status bar with the current active progress.
     * Should be called after progressManager is initialized and loaded.
     */
    public initializeActiveProgress(): void {
        this.statusBar.updateActiveProgress(progressManager.getActiveProgressName());
    }

    public updateStatusBar(status: UserStatus, user?: string): void {
        this.statusBar.updateStatusBar(status, user);
    }

    public dispose(): void {
        this.statusBar.dispose();
        this.configurationChangeListener.dispose();
        progressManager.removeListener("progressSelected", this.progressSelectedHandler);
    }

    private setStatusBarVisibility(): void {
        if (this.isStatusBarEnabled()) {
            this.statusBar.show();
        } else {
            this.statusBar.hide();
        }
    }

    private isStatusBarEnabled(): boolean {
        const configuration: WorkspaceConfiguration = workspace.getConfiguration();
        return configuration.get<boolean>("leetcode.enableStatusBar", true);
    }
}

export const leetCodeStatusBarController: LeetCodeStatusBarController = new LeetCodeStatusBarController();
