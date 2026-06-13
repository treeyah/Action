#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <cstdio>

using namespace std;

int main() {
    string c;
    vector<string> program;
    map<string, string> vars;

    while (true) {
        getline(cin, c);

        if (c == "exit()") {
            break;
        } else if (c == "clear()") {
            program.clear();
            cout << "Program cleared.\n";
        } else if (c == "list()") {
            for (int i = 0; i < program.size(); i++) {
                cout << i << ": " << program[i] << "\n";
            }
        } else if (c == "run()") {
            int repeatCount = 1;

            for (string line : program) {
                if (line.find("repeat(") == 0) {
                    sscanf(line.c_str(), "repeat(%d)", &repeatCount);
                } else if (line.find("write(") == 0) {
                    for (int i = 0; i < repeatCount; i++) {
                        cout << line.substr(6, line.size() - 7) << "\n";
                    }
                    repeatCount = 1;
                } else if (line.find("add(") == 0) {
                    int a, b;
                    sscanf(line.c_str(), "add(%d+%d)", &a, &b);

                    for (int i = 0; i < repeatCount; i++) {
                        cout << a + b << "\n";
                    }
                    repeatCount = 1;
                } else if (line.find("minus(") == 0) {
                    int a, b;
                    sscanf(line.c_str(), "minus(%d-%d)", &a, &b);

                    for (int i = 0; i < repeatCount; i++) {
                        cout << a - b << "\n";
                    }
                    repeatCount = 1;
                } else if (line.find("times(") == 0) {
                    int a, b;
                    sscanf(line.c_str(), "times(%d*%d)", &a, &b);

                    for (int i = 0; i < repeatCount; i++) {
                        cout << a * b << "\n";
                    }
                    repeatCount = 1;
                } else if (line.find("divide(") == 0) {
                    int a, b;
                    sscanf(line.c_str(), "divide(%d/%d)", &a, &b);

                    if (b == 0) {
                        cout << "Error: Cannot divide by zero.\n";
                    } else {
                        for (int i = 0; i < repeatCount; i++) {
                            cout << a / b << "\n";
                        }
                    }
                    repeatCount = 1;
                } else if (line.find("set(") == 0) {
                    string inside = line.substr(4, line.size() - 5);
                    int equals = inside.find('=');

                    string name = inside.substr(0, equals);
                    string value = inside.substr(equals + 1);
                    vars[name] = value;
                } else if (line.find("get(") == 0) {
                    string name = line.substr(4, line.size() - 5);

                    for (int i = 0; i < repeatCount; i++) {
                        cout << vars[name] << "\n";
                    }
                    repeatCount = 1;
                }
            }

            cout << "\nProgram finished.\n";
        } else {
            program.push_back(c);
        }
    }

    return 0;
}