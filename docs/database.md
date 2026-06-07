Guide on how to start the DB. -by CrX
---
1.Open XAMPP, and open my_ini config file next to mySql.

2.Once inside the my_ini txt file find anything related to port and change all instances to match the DB port.

3.Check if database.php is configured on your specific port.

3.Start XAMPP MySql server.

4.Open Apache config phpMyAdmin

5.Edit line: $cfg['Servers'][$i]['host'] = '127.0.0.1:your_port';

6.Save and start Apache. Go into mySql and enter into a connection created on same port and ip.

7.Add your SQL schema to the DB connection.

8.Profit.📈

---

!!Important!! 

Running the whole server and whole site is a little bit tricky. After you set both Apache and MySql servers and they are running you need to run this command in order for XAMPP to recognize your project.

`mklink /J "C:\xampp\htdocs\ULBS-Project-Web" "C:\Users\**Your_Name**\ULBS-Project-Web"`

After that just access the site at: http://localhost/ULBS-Project-Web/frontend/register.html

Explanation: For some reason XAMPP recognizes projects stored only in htdocs so you need to move a shortcut there to your project folder. That's what the above command basically does.
