#include <iostream>
#include <string>
#include <map>

using namespace std;

int main() {
    string c;
    map<string, string> vars;
    int repeatCount = 1;

    cout << "==SpaceLang==\n";

    while (true) {
        getline(cin, c);

        if (c.find("repeat(") == 0) {
            sscanf(c.c_str(), "repeat(%d)", &repeatCount);
        }

        else if (c.find("write(") == 0) {
            for (int i = 0; i < repeatCount; i++) {
                cout << c.substr(6, c.size() - 7) << "\n";
            }
            repeatCount = 1;
        }

        else if (c.find("add(") == 0) {
            int a, b;
            sscanf(c.c_str(), "add(%d+%d)", &a, &b);

            for (int i = 0; i < repeatCount; i++) {
                cout << a + b << "\n";
            }

            repeatCount = 1;
        }

        else if (c.find("get(") == 0) {
            string name = c.substr(4, c.size() - 5);

            for (int i = 0; i < repeatCount; i++) {
                cout << vars[name] << "\n";
            }

            repeatCount = 1;
        }

        else {
            cout << "Code not found\n";
            repeatCount = 1;
        }
    }

    return 0;
}