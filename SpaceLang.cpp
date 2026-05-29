#include <iostream>
#include <string>
#include <map>

using namespace std;

int main() {
    string c;
    map<string, string> vars;
    cout << "==SpaceLang==\n";
    while (true) {

        getline(cin, c);

        // WRITE
        if (c.find("write(") == 0) {
            cout << c.substr(6, c.size() - 7);

        }

        // ADD
        else if (c.find("add(") == 0) {
            int a, b;
            sscanf(c.c_str(), "add(%d+%d)", &a, &b);
            cout << a + b;

        }

        // MINUS
        else if (c.find("minus(") == 0) {
            int a, b;
            sscanf(c.c_str(), "minus(%d-%d)", &a, &b);
            cout << a - b;

        }
        // TIMES
        else if (c.find("times(") == 0) {
            int a, b;
            sscanf(c.c_str(), "times(%d*%d)", &a, &b);
            cout << a * b;

        }
        // DIVIDE
        else if (c.find("divide(") == 0) {
            int a, b;
            sscanf(c.c_str(), "divise(%d/%d)", &a, &b);
            cout << a / b;

        }


        // SET
        else if (c.find("set(") == 0) {
            string inside = c.substr(4, c.size() - 5);
            int equals = inside.find('=');
            string name = inside.substr(0, equals);
            string value = inside.substr(equals + 1);
            vars[name] = value;
            cout << "Set!";

        }

        // GET
        else if (c.find("get(") == 0) {
            string name = c.substr(4, c.size() - 5);
            cout << vars[name];
        }

        else {
            cout << "Code not found";
        }

        cout << "\n";
    }

    return 0;
}