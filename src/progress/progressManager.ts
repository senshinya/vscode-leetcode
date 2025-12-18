// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { EventEmitter } from "events";
import { IProgress, IProgressListItem, ISolution, ProblemState } from "./types";
import {
    createEmptyProgress,
    getProgressDir,
    getProgressFilePath,
    loadProgressFile,
    progressFileExists,
    saveProgressFile,
} from "./progressFile";
import { getWorkspaceFolder } from "../utils/settingUtils";
import * as fse from "fs-extra";
import * as path from "path";

const ACTIVE_PROGRESS_KEY = "leetcode.activeProgress";

/**
 * Validates a progress name for valid characters
 * @param name The progress name to validate
 * @returns true if valid, false otherwise
 */
function isValidProgressName(name: string): boolean {
    if (!name || name.trim().length === 0) {
        return false;
    }
    // Allow alphanumeric, hyphens, underscores, and spaces
    // Disallow special characters that could cause filesystem issues
    const validPattern = /^[a-zA-Z0-9_\- ]+$/;
    return validPattern.test(name);
}

class ProgressManager extends EventEmitter implements vscode.Disposable {
    private context: vscode.ExtensionContext | undefined;
    private activeProgress: IProgress | undefined;
    private activeProgressName: string | undefined;

    constructor() {
        super();
    }

    /**
     * Initializes the ProgressManager with the extension context
     */
    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        // Load the previously active progress name from global state
        this.activeProgressName = context.globalState.get<string>(ACTIVE_PROGRESS_KEY);
    }

    /**
     * Disposes of the ProgressManager resources
     */
    public dispose(): void {
        this.activeProgress = undefined;
        this.activeProgressName = undefined;
        this.removeAllListeners();
    }

    /**
     * Gets the workspace directory for progress files
     */
    private getWorkspaceDir(): string {
        const workspaceFolder = getWorkspaceFolder();
        if (!workspaceFolder) {
            throw new Error("No workspace folder configured. Please set leetcode.workspaceFolder in settings.");
        }
        return workspaceFolder;
    }


    // ==================== Progress CRUD Operations ====================

    /**
     * Creates a new progress with the given name
     * @param name The name for the new progress
     * @throws Error if name is invalid or already exists
     * Requirements: 1.1, 1.2, 1.3
     */
    public async createProgress(name: string): Promise<void> {
        // Validate progress name
        if (!isValidProgressName(name)) {
            throw new Error("Invalid progress name. Use only letters, numbers, hyphens, underscores, and spaces.");
        }

        const workspaceDir = this.getWorkspaceDir();
        const filePath = getProgressFilePath(workspaceDir, name);

        // Check for duplicate name
        if (await progressFileExists(filePath)) {
            throw new Error(`Progress "${name}" already exists.`);
        }

        // Create progress directory if it doesn't exist
        const progressDir = getProgressDir(workspaceDir);
        await fse.ensureDir(progressDir);

        // Initialize empty progress file
        const progress = createEmptyProgress(name);
        await saveProgressFile(filePath, progress);

        this.emit("progressCreated", name);
    }

    /**
     * Lists all available progresses
     * @returns Array of progress names
     * Requirements: 8.1
     */
    public async listProgresses(): Promise<string[]> {
        const workspaceDir = this.getWorkspaceDir();
        const progressDir = getProgressDir(workspaceDir);

        // Check if progress directory exists
        if (!await fse.pathExists(progressDir)) {
            return [];
        }

        // Read directory and filter for .json files
        const files = await fse.readdir(progressDir);
        const progressNames: string[] = [];

        for (const file of files) {
            if (file.endsWith(".json")) {
                // Remove .json extension to get progress name
                progressNames.push(path.basename(file, ".json"));
            }
        }

        return progressNames;
    }

    /**
     * Lists all available progresses with active indicator
     * @returns Array of progress list items with name and active status
     * Requirements: 8.1, 8.2, 8.3
     */
    public async listProgressesWithStatus(): Promise<IProgressListItem[]> {
        const progressNames = await this.listProgresses();

        return progressNames.map((name) => ({
            name,
            isActive: name === this.activeProgressName,
        }));
    }

    /**
     * Deletes a progress by name
     * @param name The name of the progress to delete
     * Requirements: 7.2, 7.3
     */
    public async deleteProgress(name: string): Promise<void> {
        const workspaceDir = this.getWorkspaceDir();
        const filePath = getProgressFilePath(workspaceDir, name);

        // Check if progress exists
        if (!await progressFileExists(filePath)) {
            throw new Error(`Progress "${name}" does not exist.`);
        }

        // Remove the progress file
        await fse.remove(filePath);

        // Clear active progress if the deleted progress was active
        if (this.activeProgressName === name) {
            await this.selectProgress(undefined);
        }

        this.emit("progressDeleted", name);
    }

    // ==================== Active Progress Management ====================

    /**
     * Selects a progress as the active progress
     * @param name The name of the progress to select, or undefined to deselect
     * Requirements: 2.2, 2.3, 2.4
     */
    public async selectProgress(name: string | undefined): Promise<void> {
        if (name) {
            const workspaceDir = this.getWorkspaceDir();
            const filePath = getProgressFilePath(workspaceDir, name);

            // Verify progress exists
            if (!await progressFileExists(filePath)) {
                throw new Error(`Progress "${name}" does not exist.`);
            }

            // Load the progress file
            this.activeProgress = await loadProgressFile(filePath);
            this.activeProgressName = name;
        } else {
            // Deselect - clear active progress
            this.activeProgress = undefined;
            this.activeProgressName = undefined;
        }

        // Persist selection to global state
        if (this.context) {
            await this.context.globalState.update(ACTIVE_PROGRESS_KEY, this.activeProgressName);
        }

        this.emit("progressSelected", this.activeProgressName);
    }

    /**
     * Gets the currently active progress
     * @returns The active progress or undefined
     */
    public getActiveProgress(): IProgress | undefined {
        return this.activeProgress;
    }

    /**
     * Gets the name of the currently active progress
     * @returns The active progress name or undefined
     */
    public getActiveProgressName(): string | undefined {
        return this.activeProgressName;
    }

    /**
     * Checks if there is an active progress selected
     * @returns true if an active progress is selected
     */
    public hasActiveProgress(): boolean {
        return this.activeProgressName !== undefined;
    }


    // ==================== Problem State Management ====================

    /**
     * Gets the problem state from the active progress
     * @param problemId The problem ID
     * @returns The problem state or undefined if not in progress
     */
    public getProblemState(problemId: string): ProblemState | undefined {
        if (!this.activeProgress) {
            return undefined;
        }
        return this.activeProgress.problemStates.get(problemId);
    }

    /**
     * Sets the problem state in the active progress
     * @param problemId The problem ID
     * @param state The new state
     * Requirements: 4.2, 4.3, 4.4
     */
    public async setProblemState(problemId: string, state: ProblemState): Promise<void> {
        if (!this.activeProgress || !this.activeProgressName) {
            throw new Error("No active progress selected.");
        }

        this.activeProgress.problemStates.set(problemId, state);

        // Persist changes immediately
        const workspaceDir = this.getWorkspaceDir();
        const filePath = getProgressFilePath(workspaceDir, this.activeProgressName);
        await saveProgressFile(filePath, this.activeProgress);

        this.emit("problemStateChanged", problemId, state);
    }

    /**
     * Determines whether to use local state based on active progress
     * @returns true if local state should be used
     */
    public shouldUseLocalState(): boolean {
        return this.activeProgress !== undefined;
    }

    /**
     * Resolves the problem state based on active progress
     * @param problemId The problem ID
     * @param remoteState The remote state from LeetCode
     * @returns The resolved state (local if active progress has it, otherwise Unknown)
     * Requirements: 3.1, 3.2
     */
    public resolveProblemState(problemId: string, remoteState: ProblemState): ProblemState {
        // If no active progress, use remote state
        if (!this.shouldUseLocalState()) {
            return remoteState;
        }

        // When active progress is selected, use local state only
        // If problem is not in local progress, treat it as Unknown (not attempted)
        const localState = this.getProblemState(problemId);
        if (localState !== undefined) {
            return localState;
        }

        // Problem not in local progress = not attempted yet
        return ProblemState.Unknown;
    }

    // ==================== Solution Management ====================

    /**
     * Stores a solution in the active progress
     * @param problemId The problem ID
     * @param language The programming language
     * @param code The solution code
     * Requirements: 5.1, 5.2, 5.3
     */
    public async storeSolution(problemId: string, language: string, code: string): Promise<void> {
        if (!this.activeProgress || !this.activeProgressName) {
            throw new Error("No active progress selected.");
        }

        const solution: ISolution = {
            problemId,
            language,
            code,
            submittedAt: new Date().toISOString(),
        };

        this.activeProgress.solutions.set(problemId, solution);

        // Persist changes immediately
        const workspaceDir = this.getWorkspaceDir();
        const filePath = getProgressFilePath(workspaceDir, this.activeProgressName);
        await saveProgressFile(filePath, this.activeProgress);

        this.emit("solutionStored", problemId);
    }

    /**
     * Gets a stored solution from the active progress
     * @param problemId The problem ID
     * @returns The solution or undefined
     */
    public getSolution(problemId: string): ISolution | undefined {
        if (!this.activeProgress) {
            return undefined;
        }
        return this.activeProgress.solutions.get(problemId);
    }

    /**
     * Determines whether web solutions should be shown for a problem
     * @param problemId The problem ID
     * @returns true if web solutions should be shown
     * Requirements: 6.1, 6.2, 6.3
     */
    public shouldShowWebSolution(problemId: string): boolean {
        // If no active progress, use default behavior (show web solutions)
        if (!this.shouldUseLocalState()) {
            return true;
        }

        const state = this.getProblemState(problemId);
        // Only show web solutions if problem is marked as completed (AC)
        return state === ProblemState.AC;
    }

    /**
     * Loads the active progress from disk if one was previously selected
     * Should be called after initialize() to restore state
     */
    public async loadActiveProgress(): Promise<void> {
        if (!this.activeProgressName) {
            return;
        }

        try {
            const workspaceDir = this.getWorkspaceDir();
            const filePath = getProgressFilePath(workspaceDir, this.activeProgressName);

            if (await progressFileExists(filePath)) {
                this.activeProgress = await loadProgressFile(filePath);
            } else {
                // Progress file was deleted externally, clear the selection
                this.activeProgressName = undefined;
                if (this.context) {
                    await this.context.globalState.update(ACTIVE_PROGRESS_KEY, undefined);
                }
            }
        } catch (error) {
            // If loading fails, clear the active progress
            this.activeProgress = undefined;
            this.activeProgressName = undefined;
            if (this.context) {
                await this.context.globalState.update(ACTIVE_PROGRESS_KEY, undefined);
            }
        }
    }
}

export const progressManager: ProgressManager = new ProgressManager();
