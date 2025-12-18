// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ProblemState } from "../shared";

/**
 * Represents a stored solution for a problem
 */
export interface ISolution {
    problemId: string;
    language: string;
    code: string;
    submittedAt: string;
}

/**
 * Represents a local progress record containing problem states and solutions
 */
export interface IProgress {
    name: string;
    createdAt: string;
    problemStates: Map<string, ProblemState>;  // problemId -> state
    solutions: Map<string, ISolution>;          // problemId -> solution
}

/**
 * Represents the progress file structure for JSON serialization
 */
export interface IProgressFile {
    version: string;
    progress: IProgressData;
}

/**
 * Serializable progress data (uses plain objects instead of Maps)
 */
export interface IProgressData {
    name: string;
    createdAt: string;
    problemStates: Record<string, ProblemState>;  // problemId -> state
    solutions: Record<string, ISolution>;          // problemId -> solution
}

/**
 * Represents a progress item in the listing with active indicator
 */
export interface IProgressListItem {
    name: string;
    isActive: boolean;
}

// Re-export ProblemState for convenience
export { ProblemState };
