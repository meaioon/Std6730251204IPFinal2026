
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

const API_URL = 'http://119.59.102.161:3091';

type Employee = {
  id: number;
  name: string;
  position: string;
  status: 'Active' | 'On Leave';
  salary: number;
};

export default function HomeScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [clusters, setClusters] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [savingEmployee, setSavingEmployee] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      setError('');
      const response = await fetch(`${API_URL}/api/employees`);
      if (!response.ok) throw new Error('Unable to load employees');

      const data = await response.json();
      setEmployees(data.employees ?? []);
    } catch {
      setError('Cannot connect to the API. Make sure the backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const toggleStatus = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/employees/${id}/status`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Update failed');

      setEmployees((current) =>
        current.map((employee) =>
          employee.id === id ? data.employee : employee
        )
      );
    } catch {
      Alert.alert('Error', 'Could not update employee status.');
    }
  };

  const deleteEmployee = (id: number) => {
    const performDelete = async () => {
      try {
        const response = await fetch(`${API_URL}/api/employees/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Delete failed');

        setEmployees((current) =>
          current.filter((employee) => employee.id !== id)
        );
      } catch {
        Alert.alert('Error', 'Could not delete employee.');
      }
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm('Delete this employee?')) {
        void performDelete();
      }
    } else {
      Alert.alert('Delete employee', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void performDelete() },
      ]);
    }
  };

  const handleLogin = async () => {
    setLoginError('');

    if (!username.trim() || !password) {
      setLoginError('Please enter your username and password.');
      return;
    }

    setLoggingIn(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setLoginError('Invalid username or password.');
        return;
      }

      setIsLoggedIn(true);
    } catch {
      setLoginError('Cannot connect to the server. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };
  const addEmployee = async () => {
  const salary = Number(newSalary);

    if (
      !newName.trim() ||
      !newPosition.trim() ||
      !newSalary.trim()
    ) {
      Alert.alert('Missing information', 'Please fill in all fields.');
      return;
    }

    if (!Number.isFinite(salary) || salary <= 0) {
      Alert.alert(
        'Invalid salary',
        'Please enter a valid salary greater than zero.'
      );
      return;
    }

    setSavingEmployee(true);

    try {
      const response = await fetch(`${API_URL}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim(),
          position: newPosition.trim(),
          salary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not add employee.');
      }

      setNewName('');
      setNewPosition('');
      setNewSalary('');
      setShowAddForm(false);
      await loadEmployees();
      Alert.alert('Success', 'Employee added successfully.');
    } catch (error) {
      Alert.alert(
        'Add Employee Error',
        error instanceof Error ? error.message : 'Could not add employee.'
      );
    } finally {
      setSavingEmployee(false);
    }
  };
  const analyzeSalary = async () => {
    setAnalyzing(true);

    try {
      const response = await fetch(
        `${API_URL}/api/employees/salary-clusters`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Salary analysis failed'
        );
      }

      setClusters(data);
    } catch (error) {
      Alert.alert(
        'Analysis Error',
        error instanceof Error
          ? error.message
          : 'Could not analyze salaries.'
      );
    } finally {
      setAnalyzing(false);
    }
  };
  const totalPayroll = employees.reduce(
    (sum, employee) => sum + employee.salary,
    0
  );
  const activeCount = employees.filter(
    (employee) => employee.status === 'Active'
  ).length;

  const money = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  
  return (
    !isLoggedIn ? (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loginContainer}>
          <Text style={styles.eyebrow}>PEOPLE OPERATIONS</Text>
          <Text style={styles.loginTitle}>HR Manager</Text>
          <Text style={styles.subtitle}>
            Sign in to manage employees and analyze salaries.
          </Text>

          <View style={styles.loginCard}>
            <Text style={styles.loginHeading}>Welcome Back</Text>
            <Text style={styles.loginLabel}>Username</Text>
            <TextInput
              style={styles.loginInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.loginLabel}>Password</Text>
            <TextInput
              style={styles.loginInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
            />

            {loginError ? (
              <Text style={styles.error}>{loginError}</Text>
            ) : null}

            <Pressable
              style={styles.analyzeButton}
              onPress={() => void handleLogin()}
              disabled={loggingIn}
            >
              {loggingIn ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.analyzeButtonText}>Sign In</Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    ) : (
      <SafeAreaView style={styles.screen}>
        <FlatList
          data={employees}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadEmployees();
              }}
            />
          }
          ListHeaderComponent={
            <View>
              <Text style={styles.eyebrow}>PEOPLE OPERATIONS</Text>
              <Text style={styles.title}>HR Manager</Text>
              <Text style={styles.subtitle}>
                Employee management & salary analytics
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.cardLabel}>Employees</Text>
                  <Text style={styles.cardValue}>{employees.length}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.cardLabel}>Active staff</Text>
                  <Text style={styles.cardValue}>{activeCount}</Text>
                </View>
              </View>

              <View style={styles.payrollCard}>
                <Text style={styles.payrollLabel}>TOTAL MONTHLY PAYROLL</Text>
                <Text style={styles.payrollValue}>{money(totalPayroll)}</Text>
                <Text style={styles.payrollHint}>
                  Based on current employee records
                </Text>
              </View>

              <View style={styles.analysisCard}>
                <Text style={styles.sectionTitle}>Salary Structure Analysis</Text>
                <Text style={styles.analysisDescription}>
                  Group employee salaries into two clusters using K-Means.
                </Text>

                <Pressable
                  style={styles.analyzeButton}
                  onPress={() => void analyzeSalary()}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.analyzeButtonText}>
                      Analyze Salary Structure
                    </Text>
                  )}
                </Pressable>

                {clusters ? (
                  <View style={styles.clusterResult}>
                    <Text style={styles.clusterTitle}>
                      K-Means Results (K = 2)
                    </Text>
                    <Text style={styles.clusterText}>
                      {JSON.stringify(clusters, null, 2)}
                    </Text>
                  </View>
                ) : null}
              </View>
              
              <View style={styles.addEmployeeSection}>
                <Pressable
                  style={styles.analyzeButton}
                  onPress={() => setShowAddForm((current) => !current)}
                >
                  <Text style={styles.analyzeButtonText}>
                    {showAddForm ? 'Cancel' : '+ Add Employee'}
                  </Text>
                </Pressable>

                {showAddForm ? (
                  <View style={styles.loginCard}>
                    <Text style={styles.loginHeading}>New Employee</Text>

                    <Text style={styles.loginLabel}>Full Name</Text>
                    <TextInput
                      style={styles.loginInput}
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="Enter full name"
                    />

                    <Text style={styles.loginLabel}>Position</Text>
                    <TextInput
                      style={styles.loginInput}
                      value={newPosition}
                      onChangeText={setNewPosition}
                      placeholder="Enter position"
                    />

                    <Text style={styles.loginLabel}>Monthly Salary (USD)</Text>
                    <TextInput
                      style={styles.loginInput}
                      value={newSalary}
                      onChangeText={setNewSalary}
                      placeholder="Enter salary"
                      keyboardType="numeric"
                    />

                    <Pressable
                      style={styles.analyzeButton}
                      onPress={() => void addEmployee()}
                      disabled={savingEmployee}
                    >
                      {savingEmployee ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.analyzeButtonText}>Save Employee</Text>
                      )}
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Employee Directory</Text>
                <Pressable onPress={() => void loadEmployees()}>
                  <Text style={styles.refreshText}>Refresh</Text>
                </Pressable>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {loading ? <ActivityIndicator size="large" color="#4F46E5" /> : null}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.employeeCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                </Text>
              </View>

              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{item.name}</Text>
                <Text style={styles.position}>{item.position}</Text>
                <Text style={styles.salary}>{money(item.salary)}</Text>
                <Text
                  style={[
                    styles.status,
                    item.status === 'Active' ? styles.active : styles.onLeave,
                  ]}
                >
                  {item.status}
                </Text>

                <View style={styles.actions}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => void toggleStatus(item.id)}
                  >
                    <Text style={styles.secondaryButtonText}>Toggle status</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteEmployee(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            !loading && !error ? (
              <Text style={styles.empty}>No employee records found.</Text>
            ) : undefined
          }
          ListFooterComponent={
            <Text style={styles.footer}>
              HR Manager · Salary Analytics · K-Means K = 2
            </Text>
          }
        />
      </SafeAreaView>
      )
    );
  }

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#F5F7FC' 
  },
  content: { 
    padding: 22, 
    paddingBottom: 48, 
    maxWidth: 850, 
    width: '100%', 
    alignSelf: 'center' 
  },
  eyebrow: { 
    color: '#4F46E5', 
    fontWeight: '800', 
    fontSize: 11, 
    letterSpacing: 2, 
    marginTop: 18 
  },
  title: { 
    color: '#151A2D', 
    fontSize: 34, 
    fontWeight: '800', 
    marginTop: 8 
  },
  subtitle: { 
    color: '#6B7280', 
    fontSize: 14, 
    marginTop: 6, 
    marginBottom: 22 
  },
  summaryRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 12 
  },
  summaryCard: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    padding: 18, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E6EAF2' 
  },
  cardLabel: { 
    color: '#6B7280', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  cardValue: { 
    color: '#171C31', 
    fontSize: 28, 
    fontWeight: '800', 
    marginTop: 7 
  },
  payrollCard: { 
    backgroundColor: '#242A55', 
    padding: 22, 
    borderRadius: 18, 
    marginBottom: 26 
  },
  payrollLabel: { 
    color: '#D7DAFF', 
    fontSize: 11, 
    fontWeight: '700', 
    letterSpacing: 1.4 
  },
  payrollValue: { 
    color: '#FFFFFF', 
    fontSize: 32, 
    fontWeight: '800',
    marginTop: 9 
  },
  payrollHint: { 
    color: '#D7DAFF', 
    fontSize: 12, 
    marginTop: 5 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 14 
  },
  sectionTitle: { 
    color: '#171C31', 
    fontSize: 20, 
    fontWeight: '800' 
  },
  refreshText: { 
    color: '#4F46E5', fontWeight: '700' 
  },
  employeeCard: { 
    flexDirection: 'row', 
    gap: 14, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E6EAF2' 
  },
  avatar: { 
    width: 46, 
    height: 46, 
    borderRadius: 15, 
    backgroundColor: '#E9EAFE', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    color: '#4F46E5', 
    fontWeight: '800', 
    fontSize: 15 
  },
  employeeInfo: { 
    flex: 1 
  },
  employeeName: { 
    color: '#171C31', 
    fontSize: 16, 
    fontWeight: '800' 
  },
  position: { 
    color: '#6B7280', 
    fontSize: 13, 
    marginTop: 3 
  },
  salary: { 
    color: '#171C31', 
    fontSize: 15, 
    fontWeight: '700', 
    marginTop: 9 
  },
  status: { 
    alignSelf: 'flex-start', 
    overflow: 'hidden', 
    borderRadius: 20, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    fontSize: 11, 
    fontWeight: '700', 
    marginTop: 8 
  },
  active: { 
    backgroundColor: '#DDF7E8', 
    color: '#167344' 
  },
  onLeave: { 
    backgroundColor: '#FFF0D8', 
    color: '#9A5B00' 
  },
  actions: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginTop: 12 
  },
  secondaryButton: { 
    backgroundColor: '#EEF0FF', 
    paddingVertical: 9, 
    paddingHorizontal: 12, 
    borderRadius: 9 
  },
  secondaryButtonText: { 
    color: '#4338CA', 
    fontWeight: '700', 
    fontSize: 12 
  },
  deleteButton: { 
    backgroundColor: '#FFF0F0', 
    paddingVertical: 9, 
    paddingHorizontal: 12, 
    borderRadius: 9 
  },
  deleteButtonText: { 
    color: '#B91C1C', 
    fontWeight: '700', 
    fontSize: 12 
  },
  error: { 
    color: '#B91C1C', 
    backgroundColor: '#FFF0F0', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 12 
  },
  empty: { 
    color: '#6B7280', 
    textAlign: 'center', 
    padding: 28 
  },
  footer: { 
    color: '#9CA3AF', 
    textAlign: 'center', 
    fontSize: 12, 
    marginTop: 22 
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E6EAF2',
  },
  analysisDescription: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 14,
  },
  analyzeButton: {
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  clusterResult: {
    backgroundColor: '#F5F7FC',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  clusterTitle: {
    color: '#171C31',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  clusterText: {
    color: '#374151',
    fontSize: 12,
  },
  
  loginContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loginTitle: {
    color: '#151A2D',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 10,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    marginTop: 20,
  },
  loginHeading: {
    color: '#171C31',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 22,
  },
  loginLabel: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  loginInput: {
    backgroundColor: '#F9FAFC',
    borderWidth: 1,
    borderColor: '#DDE2EC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 18,
    color: '#171C31',
  },
  addEmployeeSection: {
    marginBottom: 20,
  },
});
