export interface ComplianceStats {
  totalEmployees: number;
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  overallComplianceRate: number;
  averageScore: number;
}

export interface DepartmentCompliance {
  department: string;
  totalAssignments: number;
  completed: number;
  complianceRate: number;
}

export interface CategoryCompletion {
  category: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface HeatmapCell {
  department: string;
  category: string;
  total: number;
  completed: number;
  rate: number;
}
