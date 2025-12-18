// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as path from "path";
import { IProgress, IProgressData, IProgressFile, ISolution, ProblemState } from "./types";

const PROGRESS_FILE_VERSION = "1.0";

/**
 * Converts IProgress (with Maps) to IProgressData (with plain objects) for JSON serialization
 */
export function progressToData(progress: IProgress): IProgressData {
    const problemStates: Record<string, ProblemState> = {};
    progress.problemStates.forEach((state, problemId) => {
        problemStates[problemId] = state;
    });

    const solutions: Record<string, ISolution> = {};
    progress.solutions.forEach((solution, problemId) => {
        solutions[problemId] = solution;
    });

    return {
        name: progress.name,
        createdAt: progress.createdAt,
        problemStates,
        solutions,
    };
}

/**
 * Converts IProgressData (with plain objects) to IProgress (with Maps) after JSON deserialization
 */
export function dataToProgress(data: IProgressData): IProgress {
    const problemStates = new Map<string, ProblemState>();
    for (const [problemId, state] of Object.entries(data.problemStates)) {
        problemStates.set(problemId, state);
    }

    const solutions = new Map<string, ISolution>();
    for (const [problemId, solution] of Object.entries(data.solutions)) {
        solutions.set(problemId, solution);
    }

    return {
        name: data.name,
        createdAt: data.createdAt,
        problemStates,
        solutions,
    };
}


/**
 * Serializes an IProgress object to a JSON string
 */
export function serializeProgress(progress: IProgress): string {
    const progressFile: IProgressFile = {
        version: PROGRESS_FILE_VERSION,
        progress: progressToData(progress),
    };
    return JSON.stringify(progressFile, null, 2);
}

/**
 * Deserializes a JSON string to an IProgress object
 * @throws Error if JSON is invalid or missing required fields
 */
export function deserializeProgress(json: string): IProgress {
    const parsed = JSON.parse(json);

    // Validate required fields
    if (!parsed.version || typeof parsed.version !== "string") {
        throw new Error("Invalid progress file: missing or invalid version");
    }
    if (!parsed.progress || typeof parsed.progress !== "object") {
        throw new Error("Invalid progress file: missing or invalid progress data");
    }

    const data = parsed.progress as IProgressData;

    // Validate progress data fields
    if (typeof data.name !== "string") {
        throw new Error("Invalid progress file: missing or invalid progress name");
    }
    if (typeof data.createdAt !== "string") {
        throw new Error("Invalid progress file: missing or invalid createdAt");
    }
    if (!data.problemStates || typeof data.problemStates !== "object") {
        throw new Error("Invalid progress file: missing or invalid problemStates");
    }
    if (!data.solutions || typeof data.solutions !== "object") {
        throw new Error("Invalid progress file: missing or invalid solutions");
    }

    return dataToProgress(data);
}

/**
 * Creates an empty progress with the given name
 */
export function createEmptyProgress(name: string): IProgress {
    return {
        name,
        createdAt: new Date().toISOString(),
        problemStates: new Map<string, ProblemState>(),
        solutions: new Map<string, ISolution>(),
    };
}

/**
 * Gets the progress directory path within a workspace
 */
export function getProgressDir(workspaceDir: string): string {
    return path.join(workspaceDir, ".leetcode", "progress");
}

/**
 * Gets the full file path for a progress file
 */
export function getProgressFilePath(workspaceDir: string, progressName: string): string {
    return path.join(getProgressDir(workspaceDir), `${progressName}.json`);
}

/**
 * Checks if a progress file exists
 */
export async function progressFileExists(filePath: string): Promise<boolean> {
    return fse.pathExists(filePath);
}

/**
 * Loads a progress from a file
 * @throws Error if file doesn't exist or is invalid
 */
export async function loadProgressFile(filePath: string): Promise<IProgress> {
    const content = await fse.readFile(filePath, "utf-8");
    return deserializeProgress(content);
}

/**
 * Saves a progress to a file
 */
export async function saveProgressFile(filePath: string, progress: IProgress): Promise<void> {
    const dir = path.dirname(filePath);
    await fse.ensureDir(dir);
    const content = serializeProgress(progress);
    await fse.writeFile(filePath, content, "utf-8");
}
