// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { LeetCodeNode } from "../explorer/LeetCodeNode";
import { leetCodeTreeDataProvider } from "../explorer/LeetCodeTreeDataProvider";
import { progressManager } from "../progress/progressManager";
import { ProblemState } from "../shared";
import { IQuickItemEx } from "../shared";
import { DialogOptions, DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

/**
 * Creates a new progress
 * Requirements: 1.1, 1.2, 1.3
 */
export async function createProgress(): Promise<void> {
    const name = await vscode.window.showInputBox({
        prompt: "Enter a name for the new progress",
        placeHolder: "e.g., interview-prep, daily-practice",
        validateInput: (value: string): string | undefined => {
            if (!value || value.trim().length === 0) {
                return "Progress name cannot be empty";
            }
            const validPattern = /^[a-zA-Z0-9_\- ]+$/;
            if (!validPattern.test(value)) {
                return "Progress name can only contain letters, numbers, hyphens, underscores, and spaces";
            }
            return undefined;
        },
    });

    if (!name) {
        return;
    }

    try {
        await progressManager.createProgress(name.trim());
        vscode.window.showInformationMessage(`Progress "${name}" created successfully.`);
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
        } else {
            await promptForOpenOutputChannel("Failed to create progress. Please open the output channel for details.", DialogType.error);
        }
    }
}


/**
 * Selects or deselects a progress
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function selectProgress(): Promise<void> {
    try {
        const progresses = await progressManager.listProgressesWithStatus();

        if (progresses.length === 0) {
            const action = await vscode.window.showInformationMessage(
                "No progresses found. Would you like to create one?",
                DialogOptions.yes,
                DialogOptions.no
            );
            if (action === DialogOptions.yes) {
                await createProgress();
            }
            return;
        }

        const picks: Array<IQuickItemEx<string | undefined>> = progresses.map((p) => ({
            label: `${p.isActive ? "$(check) " : ""}${p.name}`,
            description: p.isActive ? "Active" : "",
            value: p.name,
        }));

        // Add option to deselect (use remote state)
        picks.unshift({
            label: "$(cloud) Remote",
            description: "Use remote LeetCode state",
            value: undefined,
        });

        const choice = await vscode.window.showQuickPick(picks, {
            placeHolder: "Select a progress to activate",
        });

        if (choice === undefined) {
            return; // User cancelled
        }

        await progressManager.selectProgress(choice.value);
        await leetCodeTreeDataProvider.refresh();

        if (choice.value) {
            vscode.window.showInformationMessage(`Progress "${choice.value}" is now active.`);
        } else {
            vscode.window.showInformationMessage("Progress deselected. Using remote LeetCode state.");
        }
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
        } else {
            await promptForOpenOutputChannel("Failed to select progress. Please open the output channel for details.", DialogType.error);
        }
    }
}

/**
 * Deletes a progress
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export async function deleteProgress(): Promise<void> {
    try {
        const progresses = await progressManager.listProgressesWithStatus();

        if (progresses.length === 0) {
            vscode.window.showInformationMessage("No progresses available to delete.");
            return;
        }

        const picks: Array<IQuickItemEx<string>> = progresses.map((p) => ({
            label: `${p.isActive ? "$(check) " : ""}${p.name}`,
            description: p.isActive ? "Active" : "",
            value: p.name,
        }));

        const choice = await vscode.window.showQuickPick(picks, {
            placeHolder: "Select a progress to delete",
        });

        if (!choice) {
            return;
        }

        // Confirmation dialog
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete progress "${choice.value}"? This action cannot be undone.`,
            DialogOptions.yes,
            DialogOptions.no
        );

        if (confirm !== DialogOptions.yes) {
            return;
        }

        await progressManager.deleteProgress(choice.value);
        await leetCodeTreeDataProvider.refresh();
        vscode.window.showInformationMessage(`Progress "${choice.value}" deleted successfully.`);
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
        } else {
            await promptForOpenOutputChannel("Failed to delete progress. Please open the output channel for details.", DialogType.error);
        }
    }
}

/**
 * Lists all progresses
 * Requirements: 8.1, 8.2, 8.3
 */
export async function listProgresses(): Promise<void> {
    try {
        const progresses = await progressManager.listProgressesWithStatus();

        if (progresses.length === 0) {
            vscode.window.showInformationMessage("No progresses found. Use 'Create Progress' to create one.");
            return;
        }

        const picks: Array<IQuickItemEx<string>> = progresses.map((p) => ({
            label: `${p.isActive ? "$(check) " : ""}${p.name}`,
            description: p.isActive ? "Active" : "",
            detail: p.isActive ? "Currently active progress" : "Click to select this progress",
            value: p.name,
        }));

        const choice = await vscode.window.showQuickPick(picks, {
            placeHolder: "Available progresses (click to select)",
        });

        if (choice) {
            await progressManager.selectProgress(choice.value);
            await leetCodeTreeDataProvider.refresh();
            vscode.window.showInformationMessage(`Progress "${choice.value}" is now active.`);
        }
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
        } else {
            await promptForOpenOutputChannel("Failed to list progresses. Please open the output channel for details.", DialogType.error);
        }
    }
}


/**
 * Marks a problem as completed in the active progress
 * Requirements: 4.2
 */
export async function markComplete(node: LeetCodeNode): Promise<void> {
    if (!progressManager.hasActiveProgress()) {
        vscode.window.showWarningMessage("No active progress selected. Please select a progress first.");
        return;
    }

    try {
        await progressManager.setProblemState(node.id, ProblemState.AC);
        await leetCodeTreeDataProvider.refresh();
        vscode.window.showInformationMessage(`Problem "${node.name}" marked as completed.`);
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
        } else {
            await promptForOpenOutputChannel("Failed to mark problem as completed. Please open the output channel for details.", DialogType.error);
        }
    }
}

/**
 * Marks a problem as uncompleted in the active progress
 * Requirements: 4.3
 */
export async function markUncomplete(node: LeetCodeNode): Promise<void> {
    if (!progressManager.hasActiveProgress()) {
        vscode.window.showWarningMessage("No active progress selected. Please select a progress first.");
        return;
    }

    try {
        await progressManager.setProblemState(node.id, ProblemState.NotAC);
        await leetCodeTreeDataProvider.refresh();
        vscode.window.showInformationMessage(`Problem "${node.name}" marked as uncompleted.`);
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
        } else {
            await promptForOpenOutputChannel("Failed to mark problem as uncompleted. Please open the output channel for details.", DialogType.error);
        }
    }
}

/**
 * Views the stored solution for a problem
 * Requirements: 5.4
 */
export async function viewStoredSolution(node: LeetCodeNode): Promise<void> {
    if (!progressManager.hasActiveProgress()) {
        vscode.window.showWarningMessage("No active progress selected. Please select a progress first.");
        return;
    }

    const solution = progressManager.getSolution(node.id);
    if (!solution) {
        vscode.window.showInformationMessage(`No stored solution found for problem "${node.name}".`);
        return;
    }

    try {
        // Create a virtual document to display the solution
        const content = formatStoredSolution(node, solution);
        const doc = await vscode.workspace.openTextDocument({
            content,
            language: mapLanguageToVSCode(solution.language),
        });
        await vscode.window.showTextDocument(doc, { preview: true });
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
        } else {
            await promptForOpenOutputChannel("Failed to view stored solution. Please open the output channel for details.", DialogType.error);
        }
    }
}

/**
 * Formats a stored solution for display
 */
function formatStoredSolution(node: LeetCodeNode, solution: { problemId: string; language: string; code: string; submittedAt: string }): string {
    const header = [
        `// Problem: ${node.name}`,
        `// Problem ID: ${solution.problemId}`,
        `// Language: ${solution.language}`,
        `// Submitted: ${new Date(solution.submittedAt).toLocaleString()}`,
        `// Progress: ${progressManager.getActiveProgressName()}`,
        "",
        "",
    ].join("\n");

    return header + solution.code;
}

/**
 * Maps LeetCode language names to VS Code language identifiers
 */
function mapLanguageToVSCode(language: string): string {
    const mapping: Record<string, string> = {
        "bash": "shellscript",
        "c": "c",
        "cpp": "cpp",
        "csharp": "csharp",
        "golang": "go",
        "java": "java",
        "javascript": "javascript",
        "kotlin": "kotlin",
        "mysql": "sql",
        "php": "php",
        "python": "python",
        "python3": "python",
        "ruby": "ruby",
        "rust": "rust",
        "scala": "scala",
        "swift": "swift",
        "typescript": "typescript",
    };
    return mapping[language] || "plaintext";
}
